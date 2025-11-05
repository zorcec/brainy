/**
 * Module: markdown/playbookExecutor.ts
 *
 * Description:
 *   Executes playbook blocks step-by-step, managing state transitions and handling errors.
 *   Supports pause, resume, and stop operations. Only annotation blocks (e.g., @task, @model)
 *   trigger execution; plainText, plainComment, and code blocks are logged but not executed.
 *
 * Architecture:
 *   - Async execution loop with state checking between steps
 *   - Integration with execution state and decorations
 *   - Error handling with proper state transitions
 *
 * Usage:
 *   import { executePlaybook, stopPlaybookExecution } from './playbookExecutor';
 *   await executePlaybook(editor, blocks, onProgress, onError, onComplete);
 */

import * as vscode from 'vscode';
import type { AnnotationBlock } from '../parser';
import { getExecutionState, setExecutionState, resetExecutionState } from './executionState';
import { highlightCurrentSkill, highlightFailedSkill, clearExecutionDecorations } from './executionDecorations';

/**
 * Callback for progress updates during playbook execution
 * 
 * @param stepIndex - The zero-based index of the current step
 * @param block - The block being executed
 */
export type OnProgressCallback = (stepIndex: number, block: AnnotationBlock) => void;

/**
 * Callback for error handling during playbook execution
 * 
 * @param stepIndex - The zero-based index of the step that failed
 * @param block - The block that failed
 * @param error - The error that occurred
 */
export type OnErrorCallback = (stepIndex: number, block: AnnotationBlock, error: Error) => void;

/**
 * Callback when playbook execution completes successfully
 */
export type OnCompleteCallback = () => void;

/**
 * Executes playbook blocks step-by-step with pause/stop support
 * 
 * @param editor - The text editor containing the playbook
 * @param blocks - The parsed blocks to execute
 * @param onProgress - Callback for progress updates (optional)
 * @param onError - Callback for error handling (optional)
 * @param onComplete - Callback when execution completes (optional)
 */
export async function executePlaybook(
	editor: vscode.TextEditor,
	blocks: AnnotationBlock[],
	onProgress?: OnProgressCallback,
	onError?: OnErrorCallback,
	onComplete?: OnCompleteCallback
): Promise<void> {
	const editorUri = editor.document.uri.toString();

	// Execute blocks sequentially
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		const state = getExecutionState(editorUri);

		// Check if stopped
		if (state === 'stopped' || state === 'idle') {
			console.log('Playbook execution stopped');
			clearExecutionDecorations(editor);
			return;
		}

		// Wait while paused
		while (getExecutionState(editorUri) === 'paused') {
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		// Check state again after pause
		const stateAfterPause = getExecutionState(editorUri);
		if (stateAfterPause === 'stopped' || stateAfterPause === 'idle') {
			console.log('Playbook execution stopped after pause');
			clearExecutionDecorations(editor);
			return;
		}

		try {
			// Highlight current step
			if (block.line !== undefined) {
				highlightCurrentSkill(editor, block.line - 1);  // Convert to 0-based
			}

			// Notify progress
			if (onProgress) {
				onProgress(i, block);
			}

			// Execute the block
			await executeBlock(block);

			// Small delay between steps for UI feedback
			await new Promise(resolve => setTimeout(resolve, 100));

		} catch (error) {
			console.error('Error executing block:', error);

			// Highlight failed block
			if (block.line !== undefined) {
				highlightFailedSkill(editor, block.line - 1);  // Convert to 0-based
			}

			// Set error state
			setExecutionState(editorUri, 'error');

			// Notify error
			if (onError && error instanceof Error) {
				onError(i, block, error);
			}

			return;
		}
	}

	// Clear decorations and reset state on successful completion
	clearExecutionDecorations(editor);
	resetExecutionState(editorUri);

	// Notify completion
	if (onComplete) {
		onComplete();
	}
}

/**
 * Executes a single block based on its type
 * 
 * @param block - The block to execute
 */
async function executeBlock(block: AnnotationBlock): Promise<void> {
	// Skip non-annotation blocks (plainText, plainComment, code blocks)
	if (block.name === 'plainText' || block.name === 'plainComment' || block.name === 'plainCodeBlock') {
		console.log(`Skipping ${block.name} block`);
		return;
	}

	// For now, just log the block
	// TODO: Integrate with skills system in future iterations
	console.log(`Executing block: ${block.name}`, block);

	// Simulate async work
	await new Promise(resolve => setTimeout(resolve, 200));
}

/**
 * Stops playbook execution for a given editor
 * 
 * @param editor - The text editor
 */
export function stopPlaybookExecution(editor: vscode.TextEditor): void {
	const editorUri = editor.document.uri.toString();
	resetExecutionState(editorUri);
	clearExecutionDecorations(editor);
}
