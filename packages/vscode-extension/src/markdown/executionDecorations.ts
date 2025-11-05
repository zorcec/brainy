/**
 * Module: markdown/executionDecorations.ts
 *
 * Description:
 *   Manages decorations for playbook execution feedback.
 *   Highlights the currently executing skill in yellow and failed skills in red.
 *   Uses theme-aware colors for better accessibility.
 *
 * Architecture:
 *   - Singleton decoration types for current and failed skills
 *   - Functions to apply, update, and clear decorations
 *   - Editor-specific decoration tracking
 *
 * Usage:
 *   import { highlightCurrentSkill, highlightFailedSkill, clearExecutionDecorations } from './executionDecorations';
 *   highlightCurrentSkill(editor, lineNumber);
 *   highlightFailedSkill(editor, lineNumber);
 *   clearExecutionDecorations(editor);
 */

import * as vscode from 'vscode';

/**
 * Decoration type for currently executing skill (yellow/warning background)
 */
let currentSkillDecorationType: vscode.TextEditorDecorationType | undefined;

/**
 * Decoration type for failed skill (red/error background)
 */
let failedSkillDecorationType: vscode.TextEditorDecorationType | undefined;

/**
 * Gets or creates the current skill decoration type
 */
function getCurrentSkillDecorationType(): vscode.TextEditorDecorationType {
	if (!currentSkillDecorationType) {
		currentSkillDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editorWarning.background'),
			borderRadius: '2px',
			border: '1px solid',
			borderColor: new vscode.ThemeColor('editorWarning.border'),
			isWholeLine: true,
		});
	}
	return currentSkillDecorationType;
}

/**
 * Gets or creates the failed skill decoration type
 */
function getFailedSkillDecorationType(): vscode.TextEditorDecorationType {
	if (!failedSkillDecorationType) {
		failedSkillDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editorError.background'),
			borderRadius: '2px',
			border: '1px solid',
			borderColor: new vscode.ThemeColor('editorError.border'),
			isWholeLine: true,
		});
	}
	return failedSkillDecorationType;
}

/**
 * Highlights the currently executing skill line in yellow
 * 
 * @param editor - The text editor to apply decorations to
 * @param line - The zero-based line number to highlight
 */
export function highlightCurrentSkill(editor: vscode.TextEditor, line: number): void {
	const range = new vscode.Range(line, 0, line, Number.MAX_SAFE_INTEGER);
	editor.setDecorations(getCurrentSkillDecorationType(), [range]);
}

/**
 * Highlights a failed skill line in red
 * 
 * @param editor - The text editor to apply decorations to
 * @param line - The zero-based line number to highlight
 */
export function highlightFailedSkill(editor: vscode.TextEditor, line: number): void {
	const range = new vscode.Range(line, 0, line, Number.MAX_SAFE_INTEGER);
	editor.setDecorations(getFailedSkillDecorationType(), [range]);
}

/**
 * Clears all execution decorations (current and failed) from the editor
 * 
 * @param editor - The text editor to clear decorations from
 */
export function clearExecutionDecorations(editor: vscode.TextEditor): void {
	if (currentSkillDecorationType) {
		editor.setDecorations(currentSkillDecorationType, []);
	}
	if (failedSkillDecorationType) {
		editor.setDecorations(failedSkillDecorationType, []);
	}
}

/**
 * Disposes decoration types. Used for cleanup.
 */
export function dispose(): void {
	if (currentSkillDecorationType) {
		currentSkillDecorationType.dispose();
		currentSkillDecorationType = undefined;
	}
	if (failedSkillDecorationType) {
		failedSkillDecorationType.dispose();
		failedSkillDecorationType = undefined;
	}
}
