/**
 * Module: blocks/codeBlock.ts
 *
 * Description:
 *   Code block detection and extraction logic for Brainy markdown parser.
 *   Handles triple-backtick fenced code blocks with optional language metadata.
 *
 *   Key behaviors:
 *   - Detects code blocks starting with ``` (triple backticks)
 *   - Extracts language metadata from the opening fence (e.g., ```python)
 *   - Language is preserved exactly as written (no normalization)
 *   - Returns error for unclosed code blocks (critical parsing error)
 *   - Code blocks are represented as plainCodeBlock objects
 *
 * Usage:
 *   import { parseCodeBlock, isCodeFenceOpen } from './blocks/codeBlock';
 */

import { PATTERNS } from '../regex';
import { type AnnotationBlock } from './plainText';
import { createError, type ParserError } from '../errors';
import { trimLine } from '../utils';

/**
 * Result of parsing a code block.
 */
export type CodeBlockParseResult = {
	/** The parsed code block, if successful */
	block?: AnnotationBlock;
	/** Error if parsing failed */
	error?: ParserError;
	/** Next line number to continue parsing from */
	nextLine: number;
};

/**
 * Checks if a line is the opening of a code fence (```).
 *
 * @param line - The line to check (should be trimmed)
 * @returns True if the line starts a code fence
 */
export function isCodeFenceOpen(line: string): boolean {
	const trimmed = trimLine(line);
	return PATTERNS.CODE_FENCE_OPEN.test(trimmed);
}

/**
 * Checks if a line is the closing of a code fence (```).
 *
 * @param line - The line to check (should be trimmed)
 * @returns True if the line closes a code fence
 */
export function isCodeFenceClose(line: string): boolean {
	const trimmed = trimLine(line);
	return PATTERNS.CODE_FENCE_CLOSE.test(trimmed);
}

/**
 * Extracts the language from a code fence opening line.
 *
 * @param line - The opening fence line (e.g., "```python")
 * @returns The language string, or undefined if no language specified
 */
export function extractLanguage(line: string): string | undefined {
	const trimmed = trimLine(line);
	const match = PATTERNS.CODE_FENCE_OPEN.exec(trimmed);
	if (!match) {
		return undefined;
	}
	// match[1] is the captured language group
	const language = match[1];
	return language === '' ? undefined : language;
}

/**
 * Parses a code block starting from the current line.
 * Expects the current line to be the opening fence (```).
 *
 * @param lines - All lines of the markdown
 * @param startLine - Index of the opening fence line (0-indexed)
 * @returns CodeBlockParseResult with block or error
 */
export function parseCodeBlock(lines: string[], startLine: number): CodeBlockParseResult {
	const openingLine = lines[startLine];
	const language = extractLanguage(openingLine);
	
	const codeLines: string[] = [];
	let currentLine = startLine + 1;
	let foundClosing = false;

	// Search for closing fence
	while (currentLine < lines.length) {
		const line = lines[currentLine];
		
		if (isCodeFenceClose(line)) {
			foundClosing = true;
			currentLine++; // Move past the closing fence
			break;
		}
		
		codeLines.push(line);
		currentLine++;
	}

	// If no closing fence found, return critical error
	if (!foundClosing) {
		return {
			error: createError(
				'UnclosedCodeBlock',
				'Unclosed code block detected.',
				startLine + 1, // Convert to 1-indexed
				'critical'
			),
			nextLine: currentLine
		};
	}

	// Create code block
	const block: AnnotationBlock = {
		name: 'plainCodeBlock',
		flags: [],
		content: codeLines.join('\n'),
		line: startLine + 1, // Convert to 1-indexed
		metadata: {
			language
		}
	};

	return {
		block,
		nextLine: currentLine
	};
}

/**
 * Creates a code block object manually (for testing or direct construction).
 *
 * @param content - The code content
 * @param language - Optional language identifier
 * @param lineNumber - Optional line number (1-indexed)
 * @returns AnnotationBlock representing a code block
 */
export function createCodeBlock(
	content: string,
	language?: string,
	lineNumber?: number
): AnnotationBlock {
	return {
		name: 'plainCodeBlock',
		flags: [],
		content,
		line: lineNumber,
		metadata: {
			language
		}
	};
}
