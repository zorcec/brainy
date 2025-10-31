/**
 * Module: parser/index.ts
 *
 * Description:
 *   Main entry point for the Brainy markdown parser. Parses markdown files to extract
 *   annotation blocks, flags, comments, code blocks, and plain text sections. Uses a
 *   function-based approach with regular expressions for pattern matching.
 *
 *   The parser is generic and does not hardcode annotation names or types. It extracts
 *   any annotation pattern (@annotation_name) and associated flags (--flag_name value).
 *
 *   Code blocks (triple backticks) are detected and extracted with language metadata.
 *   Unclosed code blocks result in critical parsing errors.
 *
 *   Returns a ParseResult with blocks and errors. If errors is non-empty, the playbook
 *   will not be executed.
 *
 * Usage:
 *   import { parseAnnotations } from './parser';
 *   const result = parseAnnotations(markdownContent);
 *   if (result.errors.length > 0) {
 *     // Handle errors - playbook won't execute
 *   } else {
 *     // Process blocks
 *   }
 */

import { type ParserError } from './errors';
import { type AnnotationBlock, createPlainTextBlock } from './blocks/plainText';
import { parseAnnotationBlock } from './blocks/annotation';
import { isCommentStart, parseCommentBlock } from './blocks/comment';
import { isCodeFenceOpen, parseCodeBlock } from './blocks/codeBlock';
import { isEmptyLine, trimLine, startsWith } from './utils';

// Re-export types for convenience
export type { ParserError, AnnotationBlock };
export type { Flag } from './blocks/flag';

/**
 * The result of parsing markdown.
 * If errors is non-empty, the playbook will not be executed.
 */
export type ParseResult = {
	/** Array of parsed blocks */
	blocks: AnnotationBlock[];
	/** Array of errors encountered during parsing */
	errors: ParserError[];
};

/**
 * Parses markdown content and extracts annotation blocks, flags, comments, and text.
 *
 * @param markdown - The markdown content to parse
 * @returns ParseResult with blocks and errors
 */
export function parseAnnotations(markdown: string): ParseResult {
	const blocks: AnnotationBlock[] = [];
	const errors: ParserError[] = [];

	// Handle empty input
	if (!markdown || markdown.trim().length === 0) {
		return { blocks, errors };
	}

	// Split into lines for processing
	const lines = markdown.split('\n');
	let currentLineNumber = 0;

	while (currentLineNumber < lines.length) {
		const line = lines[currentLineNumber];
		const trimmedLine = trimLine(line);

		// Skip empty lines
		if (isEmptyLine(line)) {
			currentLineNumber++;
			continue;
		}

		// Try to parse as code block
		if (isCodeFenceOpen(trimmedLine)) {
			const result = parseCodeBlock(lines, currentLineNumber);
			if (result.error) {
				errors.push(result.error);
			} else if (result.block) {
				blocks.push(result.block);
			}
			currentLineNumber = result.nextLine;
			continue;
		}

		// Try to parse as comment (single-line or multi-line)
		if (isCommentStart(trimmedLine)) {
			const result = parseCommentBlock(lines, currentLineNumber);
			if (result.block) {
				blocks.push(result.block);
			}
			currentLineNumber = result.nextLine;
			continue;
		}

		// Try to parse as annotation
		if (startsWith(trimmedLine, '@')) {
			const result = parseAnnotationBlock(lines, currentLineNumber);
			if (result.error) {
				errors.push(result.error);
			} else if (result.block) {
				blocks.push(result.block);
			}
			currentLineNumber = result.nextLine;
			continue;
		}

		// Everything else is plain text
		blocks.push(createPlainTextBlock(line, currentLineNumber + 1));
		currentLineNumber++;
	}

	return { blocks, errors };
}
