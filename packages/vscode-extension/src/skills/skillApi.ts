/**
 * Module: skills/skillApi.ts
 *
 * Description:
 *   Creates and provides the SkillApi implementation for injecting into skills.
 *   Wraps existing modelClient and sessionStore functionality in a simple API.
 *   No IPC or messaging needed - skills run in the same process as the extension.
 *
 * Usage:
 *   import { createSkillApi } from './skillApi';
 *   const api = createSkillApi();
 *   const response = await api.sendRequest('user', 'Hello!');
 */

import * as vscode from 'vscode';
import { SkillApi, SendRequestOptions, SkillMessage } from './types';
import type { AnnotationBlock } from '../parser';
import { sendRequest as modelSendRequest } from './modelClient';
import { setSelectedModel } from './sessionStore';
import {
	getVariable as getVarFromStore,
	setVariable as setVarToStore
} from './variableStore';
import {
	contextNames,
	addMessageToContext,
	getContext as getContextFromStore
} from './built-in/context';

/**
 * Creates a SkillApi instance for injecting into skills.
 * Wraps modelClient and sessionStore for a simplified skill-facing API.
 * 
 * @param blocks - All parsed blocks from the playbook (optional)
 * @param currentIndex - Index of the currently executing block (optional)
 * @returns SkillApi implementation
 */
export function createSkillApi(blocks: AnnotationBlock[] = [], currentIndex: number = 0): SkillApi {
	return {
		/**
		 * Sends a request to the model and returns the response.
		 * Automatically includes conversation context from the selected context.
		 * By default, all available tools are included unless explicitly overridden.
		 * 
		 * @param role - Message role ('user' or 'assistant')
		 * @param content - Message content
		 * @param modelId - Optional model ID override
		 * @param options - Optional request options including tools
		 * @returns Promise with response object containing 'response' field
		 * @throws Error on validation, timeout, or provider failures
		 */
		async sendRequest(role, content, model, options) {
			if (role === 'agent') {
				throw new Error("'agent' role is not valid for LLM requests. Only 'user' or 'assistant' are allowed.");
			}
			
			// Get context messages from the selected context
			const context = await getContextFromStore();
			const contextMessages: any[] = context ? context.messages : [];
			
			// Determine which tools to use:
			// - If tools is undefined, use all available tools
			// - If tools is explicitly set (including empty array), use the provided value
			const allTools = await this.getAllAvailableTools();
			const tools = options?.tools !== undefined ? options.tools : allTools;
			
			const response = await modelSendRequest({
				role,
				content,
				model,
				context: contextMessages,
				tools
			});
			return { response: response.reply };
		},

		/**
		 * Selects a chat model globally for subsequent requests.
		 * 
		 * @param modelId - Model ID to select
		 * @returns Promise that resolves immediately
		 */
		async selectChatModel(model) {
			setSelectedModel(model);
		},

	/**
	 * Gets all available tools from vscode.lm.tools.
	 * Converts LanguageModelToolInformation to LanguageModelChatTool format.
	 * 
	 * @returns Promise resolving to an array of all available tools
	 */
	async getAllAvailableTools() {
		// vscode.lm.tools returns LanguageModelToolInformation[]
		// We need to convert to LanguageModelChatTool[] by extracting name, description, and inputSchema
		return Array.from(vscode.lm.tools).map(tool => ({
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema
		}));
	},		/**
		 * Gets all parsed blocks from the current playbook.
		 * 
		 * @returns Array of all parsed blocks
		 */
		getParsedBlocks() {
			return blocks;
		},

		/**
		 * Gets the index of the currently executing block.
		 * 
		 * @returns Zero-based index of the current block
		 */
		getCurrentBlockIndex() {
			return currentIndex;
		},

		/**
		 * Sets a variable value for use in playbook execution.
		 * 
		 * @param name - Variable name
		 * @param value - Variable value (must be a string)
		 */
		setVariable(name, value) {
			setVarToStore(name, value);
		},

		/**
		 * Gets a variable value by name.
		 * 
		 * @param name - Variable name
		 * @returns Variable value, or undefined if not set
		 */
		getVariable(name) {
			return getVarFromStore(name);
		},

		/**
		 * Opens an input dialog in VS Code and prompts the user for input.
		 * 
		 * @param prompt - The prompt text to display
		 * @returns Promise resolving to user input
		 * @throws Error if user cancels
		 */
		async openInputDialog(prompt) {
			const value = await vscode.window.showInputBox({
				prompt,
				placeHolder: 'Enter value...',
				ignoreFocusOut: true
			});
			
			if (value === undefined) {
				throw new Error('User cancelled input');
			}
			
			return value;
		},

		/**
		 * Adds a message to the currently selected context.
		 * 
		 * @param role - Message role ('user', 'assistant', or 'agent')
		 * @param content - Message content
		 */
	       addToContext(role, content) {
		       const contextName = contextNames();
		       if (contextName) {
			       addMessageToContext(contextName, role, content);
		       }
	       },

	       /**
		* Gets the current context (conversation history/messages) for the skill execution.
		* Returns messages from the selected context.
		* If no context is selected, returns an empty array.
		* 
		* @returns Promise resolving to array of messages from the selected context
		*/
		async getContext() {
			const context = await getContextFromStore();
			return context ? context.messages : [];
		},

		/**
		 * Opens a file picker dialog for selecting files or folders.
		 * 
		 * @param options - File picker options
		 * @returns Promise resolving to array of selected URIs, or undefined if cancelled
		 */
		async openFileDialog(options) {
			const result = await vscode.window.showOpenDialog({
				canSelectFiles: options?.canSelectFiles ?? true,
				canSelectFolders: options?.canSelectFolders ?? false,
				canSelectMany: options?.canSelectMany ?? true,
				filters: options?.filters
			});
			
			return result;
		},

		/**
		 * Opens an untitled text document for editing with optional initial content.
		 * 
		 * @param content - Optional initial content
		 * @param language - Optional language ID (default: 'markdown')
		 * @returns Promise resolving to final document content
		 * @throws Error if user cancels
		 */
		async openTextDocument(content, language) {
			// Create untitled document with content
			const doc = await vscode.workspace.openTextDocument({
				content: content || '',
				language: language || 'markdown'
			});
			
			// Show the document to user
			await vscode.window.showTextDocument(doc);
			
			// Wait for user confirmation
			const choice = await vscode.window.showInformationMessage(
				'Edit the document and click OK when done, or Cancel to abort.',
				{ modal: true },
				'OK',
				'Cancel'
			);
			
			if (choice !== 'OK') {
				throw new Error('User cancelled document editing');
			}
			
			// Get the final content
			const finalContent = doc.getText();
			
			// Close the document without saving
			await vscode.window.showTextDocument(doc);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			
			return finalContent;
		},

		/**
		 * Gets the workspace root path.
		 * 
		 * @returns Workspace root path as a string
		 * @throws Error if no workspace folder is open
		 */
		getWorkspaceRoot() {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				throw new Error('No workspace folder open');
			}
			return workspaceFolders[0].uri.fsPath;
		}
	};
}

