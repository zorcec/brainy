/**
 * Module: skills/variableStore.ts
 *
 * Description:
 *   Singleton in-memory variable store for playbook execution.
 *   Provides functions to get, set, and clear variables.
 *   Variables are case-sensitive strings.
 *
 * Usage:
 *   import { getVariable, setVariable, clearVariable } from './variableStore';
 *   setVariable('userName', 'John');
 *   const name = getVariable('userName');
 *   clearVariable('userName');
 */

/**
 * Singleton state for storing variables.
 * Key-value pairs where both key and value are strings.
 */
const variables: Record<string, string> = {};

/**
 * Gets a variable value by name.
 * Variable names are case-sensitive.
 *
 * @param name - Variable name
 * @returns Variable value, or undefined if not set
 */
export function getVariable(name: string): string | undefined {
	return variables[name];
}

/**
 * Sets a variable value.
 * Variable names are case-sensitive.
 * Overwrites existing value if already set.
 *
 * @param name - Variable name
 * @param value - Variable value (must be a string)
 */
export function setVariable(name: string, value: string): void {
	if (typeof value !== 'string') {
		throw new Error(`Variable value must be a string. Got: ${typeof value}`);
	}
	variables[name] = value;
}

/**
 * Clears a specific variable.
 *
 * @param name - Variable name to clear
 */
export function clearVariable(name: string): void {
	delete variables[name];
}

/**
 * Clears all variables.
 */
export function clearAllVariables(): void {
	for (const key in variables) {
		delete variables[key];
	}
}

/**
 * Gets all variables (for debugging/testing).
 * Returns a copy to prevent external mutation.
 *
 * @returns Copy of all variables
 */
export function getAllVariables(): Record<string, string> {
	return { ...variables };
}
