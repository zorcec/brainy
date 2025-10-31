/**
 * Module: blocks/comment.ts
 *
 * Description:
 *   Comment extraction logic for HTML-style comments.
 *   Extracts content from <!-- comment --> format.
 *   Supports both single-line and multi-line comments.
 *
 * Usage:
 *   import { isCommentStart, parseCommentBlock } from './blocks/comment';
 */

import { PATTERNS } from '../regex';
import { type AnnotationBlock, createCommentBlock } from './plainText';
import { trimLine } from '../utils';

/**
 * Result of parsing a comment block.
 */
export type CommentParseResult = {
	/** The parsed comment block, if successful */
	block?: AnnotationBlock;
	/** Next line number to continue parsing from */
	nextLine: number;
};

/**
 * Checks if a line is an HTML comment (single-line only).
 *
 * @param line - The trimmed line to check
 * @returns True if line is a single-line comment
 */
export function isComment(line: string): boolean {
	return PATTERNS.COMMENT_START.test(line) && PATTERNS.COMMENT_END.test(line);
}

/**
 * Checks if a line starts an HTML comment (could be multi-line).
 *
 * @param line - The trimmed line to check
 * @returns True if line starts a comment
 */
export function isCommentStart(line: string): boolean {
	return PATTERNS.COMMENT_START.test(line);
}

/**
 * Checks if a line ends an HTML comment.
 *
 * @param line - The line to check
 * @returns True if line ends a comment
 */
export function isCommentEnd(line: string): boolean {
	return PATTERNS.COMMENT_END.test(line);
}

/**
 * Extracts content from an HTML comment (single-line).
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

/**
 * Parses a comment block starting from the current line.
 * Handles both single-line and multi-line comments.
 *
 * @param lines - All lines of the markdown
 * @param startLine - Index of the line starting with <!-- (0-indexed)
 * @returns CommentParseResult with block
 */
export function parseCommentBlock(lines: string[], startLine: number): CommentParseResult {
	const firstLine = lines[startLine];
	const trimmedFirst = trimLine(firstLine);
	
	// Check if it's a single-line comment
	if (isComment(trimmedFirst)) {
		const content = extractCommentContent(trimmedFirst);
		return {
			block: createCommentBlock(content, startLine + 1),
			nextLine: startLine + 1
		};
	}
	
	// Multi-line comment: collect lines until we find -->
	const commentLines: string[] = [];
	let currentLine = startLine;
	let foundClosing = false;
	
	// Extract content from first line (remove <!--)
	const firstContent = trimmedFirst.replace(/^<!--\s*/, '');
	if (firstContent) {
		commentLines.push(firstContent);
	}
	
	currentLine++;
	
	// Search for closing -->
	while (currentLine < lines.length) {
		const line = lines[currentLine];
		
		if (isCommentEnd(line)) {
			foundClosing = true;
			// Extract content before -->
			const lastContent = line.replace(/\s*-->.*$/, '');
			if (lastContent.trim()) {
				commentLines.push(lastContent);
			}
			currentLine++; // Move past the closing line
			break;
		}
		
		// Add the line content
		commentLines.push(line);
		currentLine++;
	}
	
	// Join all lines and trim
	const content = commentLines.join('\n').trim();
	
	return {
		block: createCommentBlock(content, startLine + 1),
		nextLine: currentLine
	};
}
