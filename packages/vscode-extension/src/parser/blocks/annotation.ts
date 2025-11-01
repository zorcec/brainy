/**
 * Module: blocks/annotation.ts
 *
 * Description:
 *   Annotation block extraction logic.
 *   Parses annotation lines and associated flags (single-line and multi-line).
 *
 * Usage:
 *   import { parseAnnotationBlock } from './blocks/annotation';
 */

import { PATTERNS } from '../regex';
import { parseFlagsOrValues, parseFlags, type Flag } from './flag';
import { type AnnotationBlock } from './plainText';
import { createError, type ParserError } from '../errors';
import { isEmptyLine, trimLine, startsWith } from '../utils';

/**
 * Result of parsing an annotation block.
 */
export type AnnotationParseResult = {
	/** Parsed annotation block (if successful) */
	block?: AnnotationBlock;
	/** Error if parsing failed */
	error?: ParserError;
	/** Index of the next line to process */
	nextLine: number;
};

/**
 * Parses an annotation block starting at the given line.
 * Handles both single-line and multi-line annotation formats.
 *
 * @param lines - Array of all lines
 * @param startLine - Index of the line to start parsing (0-indexed)
 * @returns AnnotationParseResult with parsed block, error, and next line index
 */
export function parseAnnotationBlock(
	lines: string[],
	startLine: number
): AnnotationParseResult {
	const line = lines[startLine];
	const trimmedLine = trimLine(line);

	// Extract annotation name using regex
	const annotationMatch = PATTERNS.ANNOTATION.exec(trimmedLine);
	if (!annotationMatch) {
		return {
			error: createError(
				'INVALID_ANNOTATION',
				`Invalid annotation syntax: ${trimmedLine}`,
				startLine + 1,
				'critical',
				trimmedLine
			),
			nextLine: startLine + 1
		};
	}

	const annotationName = annotationMatch[1];
	const remainingContent = annotationMatch[2].trim();

	// Calculate annotation position
	const atIndex = line.indexOf('@');
	const annotationPosition = atIndex >= 0 ? {
		line: startLine + 1,
		start: atIndex,
		length: annotationName.length + 1 // +1 for the @ symbol
	} : undefined;

	// Start building the block
	const flags: Flag[] = [];
	let contentLines = [trimmedLine];
	let currentLine = startLine;

	// Check if there are flags on the same line
	if (remainingContent.length > 0) {
		// Parse flags from the remaining content on the same line
		// Calculate offset for inline flags (after annotation name and space)
		const flagOffset = line.indexOf(remainingContent);
		const inlineFlags = parseFlagsOrValues(remainingContent, startLine + 1, flagOffset);
		flags.push(...inlineFlags);
		currentLine++;
	} else {
		// No flags on the same line, check next lines for multi-line format
		currentLine++;
		while (currentLine < lines.length) {
			const nextLine = lines[currentLine];
			const trimmedNext = trimLine(nextLine);

			// Stop at empty line or next annotation/comment
			if (
				isEmptyLine(nextLine) ||
				startsWith(trimmedNext, '@') ||
				startsWith(trimmedNext, '<!--')
			) {
				break;
			}

			// Check if this line starts with --
			if (startsWith(trimmedNext, '--')) {
				contentLines.push(trimmedNext);
				// Calculate offset for flag start in original line
				const flagOffset = nextLine.indexOf('--');
				const lineFlags = parseFlags(trimmedNext, currentLine + 1, flagOffset);
				flags.push(...lineFlags);
				currentLine++;
			} else {
				// Not a flag line, stop multi-line parsing
				break;
			}
		}
	}

	return {
		block: {
			name: annotationName,
			flags,
			content: contentLines.join('\n'),
			line: startLine + 1,
			annotationPosition
		},
		nextLine: currentLine
	};
}
