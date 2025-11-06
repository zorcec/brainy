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
		 * 
		 * @param role - Message role ('user' or 'assistant')
		 * @param content - Message content
		 * @param modelId - Optional model ID override
		 * @param options - Optional request options including tools
		 * @returns Promise with response object containing 'response' field
		 * @throws Error on validation, timeout, or provider failures
		 */
		async sendRequest(role, content, modelId, options) {
			if (role === 'agent') {
				throw new Error("'agent' role is not valid for LLM requests. Only 'user' or 'assistant' are allowed.");
			}
			const response = await modelSendRequest({
				role,
				content,
				modelId,
				tools: options?.tools
			});
			return { response: response.reply };
		},

		/**
		 * Selects a chat model globally for subsequent requests.
		 * 
		 * @param modelId - Model ID to select
		 * @returns Promise that resolves immediately
		 */
		async selectChatModel(modelId) {
			setSelectedModel(modelId);
		},

		/**
		 * Gets all available tools from vscode.lm.tools.
		 * 
		 * @returns Promise resolving to an array of all available tools
		 */
		async getAllAvailableTools() {
			// Return all tools registered in VS Code
			return Array.from(vscode.lm.tools);
		},

		/**
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
		 * Adds a message to the currently active contexts.
		 * 
		 * @param role - Message role ('user', 'assistant', or 'agent')
		 * @param content - Message content
		 */
	       addToContext(role, content) {
		       const activeContexts = contextNames();
		       for (const contextName of activeContexts) {
			       addMessageToContext(contextName, role, content);
		       }
	       },

	       /**
		* Gets the current context (conversation history/messages) for the skill execution.
		* Returns messages from all selected contexts flattened into a single array.
		* If no contexts are selected, returns an empty array.
		* 
		* @returns Array of all messages from selected contexts
		*/
	       getContext() {
		       const contexts = getContextFromStore();
		       // Flatten all messages from all selected contexts into a single array
		       const allMessages: SkillMessage[] = [];
		       for (const context of contexts) {
			       allMessages.push(...context.messages);
		       }
		       return allMessages;
	       }
	};
}
