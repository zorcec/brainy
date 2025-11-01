/**
 * Module: blocks/plainText.ts
 *
 * Description:
 *   Plain text block creation logic.
 *   Handles any text that is not an annotation or comment.
 *
 * Usage:
 *   import { createPlainTextBlock } from './blocks/plainText';
 */

import type { Flag } from './flag';

/**
 * Position information for a token in the document.
 */
export type TokenPosition = {
	/** Line number (1-indexed) */
	line: number;
	/** Start character position in the line (0-indexed) */
	start: number;
	/** Length of the token */
	length: number;
};

/**
 * Represents a parsed block from markdown (annotation, text, comment, or code block).
 */
export type AnnotationBlock = {
	/** Block type or annotation name (e.g., 'task', 'context', 'plainText', 'plainComment', 'plainCodeBlock') */
	name: string;
	/** Array of flags associated with this block */
	flags: Flag[];
	/** Original content from the markdown */
	content: string;
	/** Optional line number where the block starts */
	line?: number;
	/** Optional position of the annotation name token (e.g., @task) */
	annotationPosition?: TokenPosition;
	/** Optional metadata (e.g., language for code blocks) */
	metadata?: {
		/** Programming language for code blocks (e.g., 'bash', 'python', 'typescript') */
		language?: string;
	};
};

/**
 * Creates a plain text block.
 *
 * @param content - The text content
 * @param lineNumber - Optional line number (1-indexed)
 * @returns AnnotationBlock representing plain text
 */
export function createPlainTextBlock(content: string, lineNumber?: number): AnnotationBlock {
	return {
		name: 'plainText',
		flags: [],
		content,
		line: lineNumber
	};
}

/**
 * Creates a comment block.
 *
 * @param content - The comment content (without tags)
 * @param lineNumber - Optional line number (1-indexed)
 * @returns AnnotationBlock representing a comment
 */
export function createCommentBlock(content: string, lineNumber?: number): AnnotationBlock {
	return {
		name: 'plainComment',
		flags: [],
		content,
		line: lineNumber
	};
}
