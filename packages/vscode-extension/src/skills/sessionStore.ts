/**
 * Module: skills/sessionStore.ts
 *
 * Description:
 *   In-memory session store for persisting selected model ID.
 *   Provides factory function to create isolated store instances for testing and injection.
 *
 * Usage:
 *   import { createSessionStore } from './sessionStore';
 *   const store = createSessionStore();
 *   store.setSelectedModel('gpt-4o');
 *   const modelId = store.getSelectedModel();
 */

/**
 * Session store interface for model selection persistence.
 */
export type SessionStore = {
	/** Sets the selected model ID */
	setSelectedModel: (modelId: string) => void;
	/** Gets the currently selected model ID, or undefined if none selected */
	getSelectedModel: () => string | undefined;
	/** Clears the selected model */
	clearSelectedModel: () => void;
};

/**
 * Creates a new session store instance.
 * Each instance maintains its own isolated state.
 *
 * @returns SessionStore instance
 */
export function createSessionStore(): SessionStore {
	let selectedModel: string | undefined = undefined;

	return {
		setSelectedModel: (modelId: string) => {
			selectedModel = modelId;
		},
		getSelectedModel: () => selectedModel,
		clearSelectedModel: () => {
			selectedModel = undefined;
		}
	};
}
