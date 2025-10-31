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

/**
 * Represents a single flag with name and value(s).
 * Value is always an array, even for single values.
 */
export type Flag = {
	/** Flag name (without the -- prefix) */
	name: string;
	/** Flag value(s), always as an array */
	value: string[];
};

/**
 * Parses flags or direct values from a string.
 * Handles both --flag "value" format and direct values like "value1" "value2".
 *
 * @param content - String containing flags or values
 * @returns Array of parsed flags
 */
export function parseFlagsOrValues(content: string): Flag[] {
	// Check if content starts with --
	if (content.startsWith('--')) {
		return parseFlags(content);
	}

	// Check if content starts with a quote (direct values)
	if (content.startsWith('"')) {
		const values = parseValues(content);
		if (values.length > 0) {
			return [{ name: '', value: values }];
		}
	}

	// Otherwise, parse unquoted word as direct value only if it doesn't start with -
	// This prevents treating things like "-invalid" as values
	if (!content.startsWith('-')) {
		const values = parseValues(content);
		if (values.length > 0) {
			return [{ name: '', value: values }];
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
 * @returns Array of parsed flags
 */
export function parseFlags(flagString: string): Flag[] {
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
		const values = parseValues(valueString);

		flags.push({
			name: flagMatch.name,
			value: values
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
