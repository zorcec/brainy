/**
 * Module: blocks/flag.ts
 *
 * Description:
 *   Flag extraction and parsing logic.
 *   Handles --flag_name "value" format with quoted and unquoted values.
 *
 * Usage:
 *   import { parseFlags, parseValues } from './blocks/flag';
 *   const flags = parseFlags('--prompt "test" --variable "var"');
 */

import { PATTERNS } from '../regex';
import type { TokenPosition } from './plainText';

/**
 * Represents a single flag with name and value(s).
 * Value is always an array, even for single values.
 */
export type Flag = {
	/** Flag name (without the -- prefix) */
	name: string;
	/** Flag value(s), always as an array */
	value: string[];
	/** Optional position of the flag name token in the document */
	position?: TokenPosition;
	/** Optional positions of quoted value tokens */
	valuePositions?: TokenPosition[];
};

/**
 * Parses flags or direct values from a string.
 * Handles both --flag "value" format and direct values like "value1" "value2".
 *
 * @param content - String containing flags or values
 * @param lineNumber - Optional line number for position tracking (1-indexed)
 * @param lineOffset - Optional character offset within the line (0-indexed)
 * @returns Array of parsed flags
 */
export function parseFlagsOrValues(content: string, lineNumber?: number, lineOffset: number = 0): Flag[] {
	// Check if content starts with --
	if (content.startsWith('--')) {
		return parseFlags(content, lineNumber, lineOffset);
	}

	// Check if content starts with a quote (direct values)
	if (content.startsWith('"')) {
		const result = parseValuesWithPositions(content, lineNumber, lineOffset);
		if (result.values.length > 0) {
			return [{ name: '', value: result.values, valuePositions: result.positions }];
		}
	}

	// Otherwise, parse unquoted word as direct value only if it doesn't start with -
	// This prevents treating things like "-invalid" as values
	if (!content.startsWith('-')) {
		const result = parseValuesWithPositions(content, lineNumber, lineOffset);
		if (result.values.length > 0) {
			return [{ name: '', value: result.values, valuePositions: result.positions }];
		}
	}

	return [];
}

/**
 * Parses flags from a string containing flag definitions.
 * Handles both --flag "value" and --flag value formats.
 * Supports multiple values in quotes separated by spaces.
 *
 * @param flagString - String containing flags
 * @param lineNumber - Optional line number for position tracking (1-indexed)
 * @param lineOffset - Optional character offset within the line (0-indexed)
 * @returns Array of parsed flags
 */
export function parseFlags(flagString: string, lineNumber?: number, lineOffset: number = 0): Flag[] {
	const flags: Flag[] = [];

	// Regex to match --flagName optionally followed by space
	// This regex handles: --flag "value" or --flag value or --flag (no value)
	const flagPattern = PATTERNS.FLAG;
	let match: RegExpExecArray | null;
	const matches: Array<{ name: string; startIndex: number; endIndex: number }> = [];

	// Find all flag names and their positions
	while ((match = flagPattern.exec(flagString)) !== null) {
		matches.push({
			name: match[1],
			startIndex: match.index,
			endIndex: match.index + match[0].length
		});
	}

	// Extract values for each flag
	for (let i = 0; i < matches.length; i++) {
		const flagMatch = matches[i];
		const nextFlagStart = i < matches.length - 1 ? matches[i + 1].startIndex : flagString.length;

		// Extract the substring containing this flag's values
		const valueStart = flagMatch.endIndex;
		const valueString = flagString.substring(valueStart, nextFlagStart).trim();

		// Parse values (handle quoted strings)
		const result = parseValuesWithPositions(valueString, lineNumber, lineOffset + valueStart);

		// Create position for flag name
		const position: TokenPosition | undefined = lineNumber !== undefined ? {
			line: lineNumber,
			start: lineOffset + flagMatch.startIndex,
			length: flagMatch.endIndex - flagMatch.startIndex
		} : undefined;

		flags.push({
			name: flagMatch.name,
			value: result.values,
			position,
			valuePositions: result.positions
		});
	}

	return flags;
}

/**
 * Parses values from a string, handling quoted strings and unquoted words.
 * Returns values as an array.
 *
 * @param valueString - String containing values
 * @returns Array of parsed values
 */
export function parseValues(valueString: string): string[] {
	const values: string[] = [];

	if (!valueString || valueString.trim().length === 0) {
		return values;
	}

	// Regex to match quoted strings (including empty) or unquoted words
	const valuePattern = PATTERNS.VALUE;
	let match: RegExpExecArray | null;

	while ((match = valuePattern.exec(valueString)) !== null) {
		// match[1] is quoted content (can be empty string), match[2] is unquoted word
		if (match[1] !== undefined) {
			values.push(match[1]);
		} else if (match[2] !== undefined) {
			values.push(match[2]);
		}
	}

	return values;
}

/**
 * Parses values from a string and returns both values and their positions.
 *
 * @param valueString - String containing values
 * @param lineNumber - Optional line number for position tracking (1-indexed)
 * @param lineOffset - Optional character offset within the line (0-indexed)
 * @returns Object with values array and positions array
 */
function parseValuesWithPositions(
	valueString: string,
	lineNumber?: number,
	lineOffset: number = 0
): { values: string[]; positions: TokenPosition[] } {
	const values: string[] = [];
	const positions: TokenPosition[] = [];

	if (!valueString || valueString.trim().length === 0) {
		return { values, positions };
	}

	// Regex to match quoted strings (including empty) or unquoted words
	const valuePattern = PATTERNS.VALUE;
	let match: RegExpExecArray | null;

	while ((match = valuePattern.exec(valueString)) !== null) {
		// match[1] is quoted content (can be empty string), match[2] is unquoted word
		if (match[1] !== undefined) {
			values.push(match[1]);
			if (lineNumber !== undefined) {
				positions.push({
					line: lineNumber,
					start: lineOffset + match.index,
					length: match[0].length
				});
			}
		} else if (match[2] !== undefined) {
			values.push(match[2]);
			if (lineNumber !== undefined) {
				positions.push({
					line: lineNumber,
					start: lineOffset + match.index,
					length: match[0].length
				});
			}
		}
	}

	return { values, positions };
}
