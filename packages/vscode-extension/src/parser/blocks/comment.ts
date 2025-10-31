/**
 * Module: blocks/comment.ts
 *
 * Description:
 *   Comment extraction logic for HTML-style comments.
 *   Extracts content from <!-- comment --> format.
 *
 * Usage:
 *   import { isComment, extractCommentContent } from './blocks/comment';
 */

import { PATTERNS } from '../regex';

/**
 * Checks if a line is an HTML comment.
 *
 * @param line - The trimmed line to check
 * @returns True if line is a comment
 */
export function isComment(line: string): boolean {
	return PATTERNS.COMMENT_START.test(line) && PATTERNS.COMMENT_END.test(line);
}

/**
 * Extracts content from an HTML comment.
 *
 * @param line - The comment line
 * @returns Comment content without the <!-- --> tags
 */
export function extractCommentContent(line: string): string {
	const match = PATTERNS.COMMENT_FULL.exec(line);
	if (match) {
		return match[1];
	}
	// Fallback: remove tags manually
	return line.slice(4, -3).trim();
}
