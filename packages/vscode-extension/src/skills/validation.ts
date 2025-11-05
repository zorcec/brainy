/**
 * Module: skills/validation.ts
 *
 * Description:
 *   Shared validation utilities for skill parameters.
 *   Reduces code duplication across built-in skills.
 *
 * Usage:
 *   import { validateRequiredString } from './validation';
 *   validateRequiredString(params.prompt, 'prompt');
 */

/**
 * Validates that a value is a non-empty string.
 * Throws a descriptive error if validation fails.
 *
 * @param value - The value to validate
 * @param paramName - The parameter name (for error messages)
 * @throws Error if value is missing, not a string, or empty/whitespace
 */
export function validateRequiredString(value: unknown, paramName: string): asserts value is string {
	if (!value || typeof value !== 'string' || value.trim() === '') {
		throw new Error(`Missing or invalid ${paramName}. Provide a non-empty ${paramName}.`);
	}
}

/**
 * Validates that a value, if provided, is a non-empty string.
 * Returns true if the value is a valid non-empty string, false otherwise.
 *
 * @param value - The value to validate
 * @returns True if value is a non-empty string, false otherwise
 */
export function isValidString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== '';
}
