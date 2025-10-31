/**
 * Module: skills/sessionStore.ts
 *
 * Description:
 *   Singleton in-memory session store for persisting selected model ID.
 *   Provides functions to get, set, and clear the selected model.
 *
 * Usage:
 *   import { getSelectedModel, setSelectedModel, clearSelectedModel } from './sessionStore';
 *   setSelectedModel('gpt-4o');
 *   const modelId = getSelectedModel();
 */

/**
 * Singleton state for selected model ID.
 */
let selectedModel: string | undefined = undefined;

/**
 * Gets the currently selected model ID.
 *
 * @returns The selected model ID, or undefined if none selected
 */
export function getSelectedModel(): string | undefined {
	return selectedModel;
}

/**
 * Sets the selected model ID.
 *
 * @param modelId - The model ID to select
 */
export function setSelectedModel(modelId: string): void {
	selectedModel = modelId;
}

/**
 * Clears the selected model.
 */
export function clearSelectedModel(): void {
	selectedModel = undefined;
}

/**
 * Resets the session store state. Used for testing.
 */
export function resetSessionStore(): void {
	selectedModel = undefined;
}
