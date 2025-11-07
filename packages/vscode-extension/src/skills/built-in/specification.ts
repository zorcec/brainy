/**
 * Module: skills/built-in/specification.ts
 *
 * Description:
 *   Built-in specification/document skill for Brainy.
 *   Opens a virtual markdown document for user input with optional prefilled content.
 *   Captures content when the document is closed and stores it in a variable or context.
 *   Uses onDidCloseTextDocument event for non-blocking, event-driven content capture.
 *
 * Usage in playbooks:
 *   @specification --variable myDoc
 *   @specification --variable spec --content "Initial content here"
 *   @specification --content "Template text"
 *
 * Parameters:
 *   - variable: Variable name to store the document content (optional)
 *   - content: Initial content to prefill the document (optional)
 *
 * Behavior:
 *   - Opens an untitled markdown document with optional prefilled content
 *   - User edits the document
 *   - When user closes the document, content is automatically captured
 *   - Content is stored in the specified variable (if provided)
 *   - Content is also added to the current context as a user message
 *   - No save dialog is shown (user is not prompted to save changes)
 */

import * as vscode from 'vscode';
import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';

/**
 * Specification/document skill implementation.
 * Opens a document for user input and captures content on close.
 */
export const specificationSkill: Skill = {
	name: 'specification',
	description: 'Open a document for user input. Captures content when closed and stores in variable/context.',
	params: [
		{ name: 'variable', description: 'Variable name to store document content', required: false },
		{ name: 'content', description: 'Initial content to prefill the document', required: false }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const { variable, content } = params;

		try {
			// Create untitled document with optional initial content
			const doc = await vscode.workspace.openTextDocument({
				content: content || '',
				language: 'markdown'
			});

			// Show the document to user
			await vscode.window.showTextDocument(doc);

			// Return immediately - the document stays open for user to edit
			// Content will be captured when they close it
			return new Promise<SkillResult>((resolve) => {
				let captured = false;
				const disposables: vscode.Disposable[] = [];

				const cleanup = () => {
					disposables.forEach(d => d.dispose());
				};

				// Monitor for editor closing
				const visibleDisposable = vscode.window.onDidChangeVisibleTextEditors(async (editors) => {
					// Check if our document is still visible
					const stillOpen = editors.some(e => e.document === doc);
					
					if (!stillOpen && !captured) {
						captured = true;
						
						// Capture content before document is fully closed
						const finalContent = doc.getText();
						
						// Store in variable if specified
						if (variable) {
							api.setVariable(variable, finalContent);
						}
						
						// Add to context
						api.addToContext('user', finalContent);
						
						// Show notification
						vscode.window.showInformationMessage(`Document captured (${finalContent.length} characters)`);
						
						cleanup();
						
						resolve({
							messages: [{
								role: 'agent',
								content: `Document captured (${finalContent.length} characters)`
							}]
						});
					}
				});
				disposables.push(visibleDisposable);

				// Handle save attempts - prevent save dialog by reverting
				const willSaveDisposable = vscode.workspace.onWillSaveTextDocument((e) => {
					if (e.document === doc) {
						// Prevent default save behavior
						e.waitUntil(Promise.resolve([]));
					}
				});
				disposables.push(willSaveDisposable);

				// Handle document close to ensure cleanup
				const closeDisposable = vscode.workspace.onDidCloseTextDocument((closedDoc) => {
					if (closedDoc === doc && !captured) {
						captured = true;
						
						// Fallback: capture what we can
						const finalContent = closedDoc.getText();
						
						if (variable) {
							api.setVariable(variable, finalContent);
						}
						
						api.addToContext('user', finalContent);
						
						vscode.window.showInformationMessage(`Document captured (${finalContent.length} characters)`);
						
						cleanup();
						
						resolve({
							messages: [{
								role: 'agent',
								content: `Document captured (${finalContent.length} characters)`
							}]
						});
					}
				});
				disposables.push(closeDisposable);
			});

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to open document: ${errorMessage}`);
		}
	}
};
