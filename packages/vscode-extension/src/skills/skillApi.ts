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

import { SkillApi } from './types';
import { sendRequest as modelSendRequest } from './modelClient';
import { setSelectedModel } from './sessionStore';

/**
 * Creates a SkillApi instance for injecting into skills.
 * Wraps modelClient and sessionStore for a simplified skill-facing API.
 * 
 * @returns SkillApi implementation
 */
export function createSkillApi(): SkillApi {
	return {
		/**
		 * Sends a request to the model and returns the response.
		 * 
		 * @param role - Message role ('user' or 'assistant')
		 * @param content - Message content
		 * @param modelId - Optional model ID override
		 * @returns Promise with response object containing 'response' field
		 * @throws Error on validation, timeout, or provider failures
		 */
		   async sendRequest(role, content, modelId) {
			   if (role === 'agent') {
				   throw new Error("'agent' role is not valid for LLM requests. Only 'user' or 'assistant' are allowed.");
			   }
			   const response = await modelSendRequest({
				   role,
				   content,
				   modelId
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
		}
	};
}
