/**
 * Module: markdown/executionState.ts
 *
 * Description:
 *   Singleton module for managing playbook execution state per editor.
 *   Tracks execution state (idle, running, paused, stopped, error) and provides
 *   functions to get, set, and reset state for each editor.
 *
 * Architecture:
 *   - Module-level state using Map to store state per editor URI
 *   - Pure functions for state management
 *   - Reset function for testing
 *
 * Usage:
 *   import { getExecutionState, setExecutionState, resetExecutionState } from './executionState';
 *   setExecutionState('file:///path/to/file.md', 'running');
 *   const state = getExecutionState('file:///path/to/file.md');
 */

/**
 * Possible execution states for a playbook
 */
export type ExecutionState = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

/**
 * Singleton state map: editor URI -> execution state
 */
const editorStates = new Map<string, ExecutionState>();

/**
 * Global flag to track if any playbook is currently executing.
 * Used to prevent concurrent playbook runs across different editors.
 */
let isAnyPlaybookRunning = false;

/**
 * URI of the currently executing playbook (if any).
 */
let currentlyExecutingPlaybookUri: string | undefined = undefined;

/**
 * Gets the execution state for a given editor URI
 * 
 * @param editorUri - The URI of the editor
 * @returns The current execution state, or 'idle' if not set
 */
export function getExecutionState(editorUri: string): ExecutionState {
	return editorStates.get(editorUri) ?? 'idle';
}

/**
 * Sets the execution state for a given editor URI
 * 
 * @param editorUri - The URI of the editor
 * @param state - The new execution state
 */
export function setExecutionState(editorUri: string, state: ExecutionState): void {
	editorStates.set(editorUri, state);
}

/**
 * Resets the execution state for a given editor URI to 'idle'
 * 
 * @param editorUri - The URI of the editor
 */
export function resetExecutionState(editorUri: string): void {
	editorStates.set(editorUri, 'idle');
}

/**
 * Resets all execution state. Used for testing.
 */
export function resetAllExecutionState(): void {
	editorStates.clear();
	isAnyPlaybookRunning = false;
	currentlyExecutingPlaybookUri = undefined;
}

/**
 * Checks if any playbook is currently running.
 * 
 * @returns True if a playbook is running, false otherwise
 */
export function isPlaybookRunning(): boolean {
	return isAnyPlaybookRunning;
}

/**
 * Gets the URI of the currently executing playbook.
 * 
 * @returns The URI of the executing playbook, or undefined if none
 */
export function getCurrentlyExecutingPlaybook(): string | undefined {
	return currentlyExecutingPlaybookUri;
}

/**
 * Marks a playbook as started. Prevents concurrent execution.
 * 
 * @param editorUri - The URI of the editor starting execution
 * @throws Error if another playbook is already running
 */
export function markPlaybookStarted(editorUri: string): void {
	if (isAnyPlaybookRunning && currentlyExecutingPlaybookUri !== editorUri) {
		throw new Error(`A playbook is already running in ${currentlyExecutingPlaybookUri}. Only one playbook can run at a time.`);
	}
	isAnyPlaybookRunning = true;
	currentlyExecutingPlaybookUri = editorUri;
	setExecutionState(editorUri, 'running');
}

/**
 * Marks a playbook as finished. Clears global execution flag.
 * 
 * @param editorUri - The URI of the editor finishing execution
 */
export function markPlaybookFinished(editorUri: string): void {
	if (currentlyExecutingPlaybookUri === editorUri) {
		isAnyPlaybookRunning = false;
		currentlyExecutingPlaybookUri = undefined;
	}
	resetExecutionState(editorUri);
}
