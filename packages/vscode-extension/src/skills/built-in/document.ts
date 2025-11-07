/**
 * Module: skills/built-in/document.ts
 *
 * Description:
 *   Built-in document skill for Brainy.
 *   Opens a real markdown document at .brainy/temp/document.md for user editing.
 *   Captures content when the document is closed and stores it in a variable or context.
 *
 * Usage in playbooks:
 *   @document --variable myDoc
 *   @document --variable spec
 *
 * Parameters:
 *   - variable: Variable name to store the document content (optional)
 *
 * Behavior:
 *   - Creates .brainy/temp/document.md in the workspace root
 *   - Opens the document for user to edit
 *   - When user closes the document, content is automatically captured
 *   - Content is stored in the specified variable (if provided)
 *   - Content is also added to the current context as a user message
 *   - Document file is left on disk for reference
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';

/**
 * Document skill implementation.
 * Opens a real markdown file for user input and captures content on close.
 */
export const documentSkill: Skill = {
	name: 'document',
	description: 'Open a document at .brainy/temp/document.md for user input. Captures content when closed. Optionally set initial content.',
	params: [
		{ name: 'variable', description: 'Variable name to store document content', required: false },
		{ name: 'content', description: 'Initial content for the document', required: false }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		 const { variable, content } = params;

		try {
			// Get workspace root
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				throw new Error('No workspace folder open');
			}
			
			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const tempDir = path.join(workspaceRoot, '.brainy', 'temp');
			const documentPath = path.join(tempDir, 'document.md');

			// Create .brainy/temp directory if it doesn't exist
			if (!fs.existsSync(tempDir)) {
				fs.mkdirSync(tempDir, { recursive: true });
			}

			 // Write initial content if provided, otherwise clear document
			 if (typeof content === 'string') {
				 fs.writeFileSync(documentPath, content, 'utf-8');
			 } else {
				 fs.writeFileSync(documentPath, '', 'utf-8');
			 }

			// Open the document
			const doc = await vscode.workspace.openTextDocument(documentPath);
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
					const stillOpen = editors.some(e => e.document.uri.fsPath === documentPath);
					
					if (!stillOpen && !captured) {
						captured = true;
						
						// Capture content from file
						const finalContent = fs.readFileSync(documentPath, 'utf-8');
						
						// Store in variable if specified
						if (variable) {
							api.setVariable(variable, finalContent);
						}
						
						// Add to context
						api.addToContext('user', finalContent);
						
						cleanup();
						
						resolve({
							messages: [{
								role: 'user',
								content: `User provided document: ${finalContent}`
							}]
						});
					}
				});
				disposables.push(visibleDisposable);

				// Handle document close to ensure cleanup
				const closeDisposable = vscode.workspace.onDidCloseTextDocument((closedDoc) => {
					if (closedDoc.uri.fsPath === documentPath && !captured) {
						captured = true;
						
						// Capture content from file
						const finalContent = fs.readFileSync(documentPath, 'utf-8');
						
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
