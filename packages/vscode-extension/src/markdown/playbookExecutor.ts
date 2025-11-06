/**
 * Module: markdown/playbookExecutor.ts
 *
 * Description:
 *   Executes playbook blocks step-by-step, managing state transitions and handling errors.
 *   Supports pause, resume, and stop operations. Only annotation blocks (e.g., @task, @model)
 *   trigger execution; plainText, plainComment, and code blocks are logged but not executed.
 *
 *   Integrates with the skills system to load and execute skills for annotation blocks.
 *   Returns skill execution results through the onProgress callback for logging and display.
 *
 * Architecture:
 *   - Async execution loop with state checking between steps
 *   - Integration with execution state and decorations
 *   - Error handling with proper state transitions
 *   - Skill loading and execution for annotation blocks
 *
 * Usage:
 *   import { executePlaybook, stopPlaybookExecution } from './playbookExecutor';
 *   await executePlaybook(editor, blocks, onProgress, onError, onComplete);
 */

import * as vscode from 'vscode';
import type { AnnotationBlock } from '../parser';
import { loadSkill, executeSkill } from '../skills/skillLoader';
import type { SkillResult } from '../skills/types';
import { 
	getExecutionState, 
	setExecutionState, 
	resetExecutionState,
	markPlaybookStarted,
	markPlaybookFinished
} from './executionState';
import { highlightCurrentSkill, highlightFailedSkill, clearExecutionDecorations } from './executionDecorations';
import { contextNames, addMessageToContext } from '../skills/built-in/context';
import { selectChatModel } from '../skills/index';

/**
 * Callback for progress updates during playbook execution
 * 
 * @param stepIndex - The zero-based index of the current step
 * @param block - The block being executed
 * @param result - The skill execution result (if block is an annotation that was executed)
 */
export type OnProgressCallback = (stepIndex: number, block: AnnotationBlock, result?: import('../skills/types').SkillResult) => void;

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

	try {
		// Check if another playbook is already running and prevent concurrent execution
		markPlaybookStarted(editorUri);
	} catch (error) {
		// Show error to user if another playbook is running
		if (error instanceof Error) {
			vscode.window.showErrorMessage(`Cannot start playbook: ${error.message}`);
		}
		throw error;
	}

	// Set default model to gpt-4.1 at the start of each playbook run
	selectChatModel('gpt-4.1');

	try {
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

				   // Execute the block and get result
				   // Pass current index and blocks array to handle context for text/code blocks
				   const result = await executeBlock(block, i, blocks, editor.document.uri);

				   // Notify progress with result
				   if (onProgress) {
					   onProgress(i, block, result);
				   }

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

				   throw error; // Re-throw to be caught by outer try-catch
			   }
		   }

		// Clear decorations and mark playbook as finished on successful completion
		clearExecutionDecorations(editor);
		markPlaybookFinished(editorUri);

		// Notify completion
		if (onComplete) {
			onComplete();
		}
	} catch (error) {
		// Ensure playbook is marked as finished even on error
		markPlaybookFinished(editorUri);
		throw error;
	}
}

/**
 * Executes a single block based on its type and returns the skill result if applicable
 * 
 * @param block - The block to execute
 * @param blockIndex - The index of the current block in the blocks array
 * @param blocks - All blocks in the playbook
 * @param workspaceUri - The workspace URI for skill loading
 * @returns SkillResult if annotation block, otherwise undefined
 */
async function executeBlock(
	block: AnnotationBlock, 
	blockIndex: number, 
	blocks: AnnotationBlock[], 
	workspaceUri?: vscode.Uri
): Promise<SkillResult | undefined> {
   // Handle plainText blocks: always add to context as agent type
   if (block.name === 'plainText') {
	   console.log(`Adding plainText block to context`);
	   const activeContexts = contextNames();
	   for (const contextName of activeContexts) {
		   addMessageToContext(contextName, 'agent', block.content);
	   }
	   return;
   }

   // Handle plainCodeBlock: add to context only if previous block is NOT execute skill
   if (block.name === 'plainCodeBlock') {
	   const previousBlock = blockIndex > 0 ? blocks[blockIndex - 1] : undefined;
	   const isPreviousExecuteSkill = previousBlock?.name === 'execute';
	   
	   if (!isPreviousExecuteSkill) {
		   console.log(`Adding plainCodeBlock to context (previous block: ${previousBlock?.name || 'none'})`);
		   const activeContexts = contextNames();
		   for (const contextName of activeContexts) {
			   addMessageToContext(contextName, 'agent', block.content);
		   }
	   } else {
		   console.log(`Skipping plainCodeBlock (previous block was execute skill)`);
	   }
	   return;
   }

   // Skip plainComment blocks
   if (block.name === 'plainComment') {
	   console.log(`Skipping ${block.name} block`);
	   return;
   }

   // Try to load and execute the skill
   try {
	   const skill = await loadSkill(block.name);
	   
	   // Convert flags to params (string values only)
	   // Flag values are arrays, so we join them or take the first value
	   // Flags without values default to empty string (not undefined)
	   const params: Record<string, string | undefined> = {};
	   if (block.flags) {
		   for (const f of block.flags) {
			   if (Array.isArray(f.value)) {
				   // Join multiple values with space, or empty string if no values
				   params[f.name] = f.value.length > 0 ? f.value.join(' ') : '';
			   } else if (typeof f.value === 'string') {
				   params[f.name] = f.value;
			   }
		   }
	   }
	   
	   const result = await executeSkill(skill, params);
	   console.log(`Executed skill: ${block.name}`, result);
	   
	   // Automatically add skill result messages to context
	   // This centralizes message handling that was previously duplicated across skills
	   if (result && result.messages && result.messages.length > 0) {
		   addSkillMessagesToContext(result);
	   }
	   
	   return result;
   } catch (err) {
	   console.error(`Failed to execute skill: ${block.name}`, err);
	   throw err;
   }
}

/**
 * Utility function to automatically add skill result messages to context.
 * Centralizes the message handling logic that was previously duplicated across skills.
 * Messages are added to all currently selected contexts.
 * 
 * @param result - The skill execution result containing messages
 */
function addSkillMessagesToContext(result: SkillResult): void {
	const activeContexts = contextNames();
	
	// Add each message from the skill result to all active contexts
	for (const message of result.messages) {
		for (const contextName of activeContexts) {
			addMessageToContext(contextName, message.role, message.content);
		}
	}
}

/**
 * Stops playbook execution for a given editor
 * 
 * @param editor - The text editor
 */
export function stopPlaybookExecution(editor: vscode.TextEditor): void {
	const editorUri = editor.document.uri.toString();
	markPlaybookFinished(editorUri);
	clearExecutionDecorations(editor);
}
