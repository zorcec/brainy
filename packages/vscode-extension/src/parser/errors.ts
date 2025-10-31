/**
 * Module: errors.ts
 *
 * Description:
 *   Error handling utilities for the parser.
 *   Provides functions to create and manage parsing errors.
 *
 * Usage:
 *   import { createError } from './errors';
 *   const error = createError('INVALID_ANNOTATION', 'Bad syntax', 1);
 */

/**
 * Represents a parsing error.
 */
export type ParserError = {
	/** Error type identifier */
	type: string;
	/** Human-readable error message */
	message: string;
	/** Optional line number where error occurred */
	line?: number;
	/** Severity level */
	severity?: 'critical' | 'warning' | 'info';
	/** Additional context about the error */
	context?: string;
};

/**
 * Creates a parser error object.
 *
 * @param type - Error type identifier
 * @param message - Human-readable error message
 * @param line - Optional line number (1-indexed)
 * @param severity - Optional severity level
 * @param context - Optional additional context
 * @returns ParserError object
 */
export function createError(
	type: string,
	message: string,
	line?: number,
	severity: 'critical' | 'warning' | 'info' = 'critical',
	context?: string
): ParserError {
	return {
		type,
		message,
		line,
		severity,
		context
	};
}
