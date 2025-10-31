/**
 * Module: utils.ts
 *
 * Description:
 *   Shared utility functions for the parser.
 *   Includes line tracking, whitespace handling, and helper functions.
 *
 * Usage:
 *   import { isEmptyLine, trimLine } from './utils';
 */

/**
 * Checks if a line is empty or contains only whitespace.
 *
 * @param line - The line to check
 * @returns True if line is empty or whitespace-only
 */
export function isEmptyLine(line: string): boolean {
	return line.trim().length === 0;
}

/**
 * Trims whitespace from a line.
 *
 * @param line - The line to trim
 * @returns Trimmed line
 */
export function trimLine(line: string): string {
	return line.trim();
}

/**
 * Checks if content starts with a specific prefix.
 *
 * @param content - The content to check
 * @param prefix - The prefix to look for
 * @returns True if content starts with prefix
 */
export function startsWith(content: string, prefix: string): boolean {
	return content.startsWith(prefix);
}
