/**
 * Module: regex.ts
 *
 * Description:
 *   Centralized regex patterns for parsing Brainy markdown annotations.
 *   Contains patterns for detecting annotations, flags, comments, and values.
 *
 * Usage:
 *   import { PATTERNS } from './regex';
 *   const match = PATTERNS.ANNOTATION.exec(line);
 */

/**
 * Regex patterns for parsing markdown annotations and components.
 */
export const PATTERNS = {
	/** Matches annotation lines starting with @ followed by word characters */
	ANNOTATION: /^@(\w+)(.*)$/,

	/** Matches flag names starting with -- followed by word characters */
	FLAG: /--(\w+)/g,

	/** Matches HTML comment tags */
	COMMENT_START: /^<!--/,
	COMMENT_END: /-->$/,
	COMMENT_FULL: /^<!--\s*(.*?)\s*-->$/,

	/** Matches flag line (starts with --) */
	FLAG_LINE: /^--/,

	/** Matches quoted strings (including empty) or unquoted words for value extraction */
	VALUE: /"([^"]*)"|(\S+)/g,

	/** Checks if content starts with annotation marker */
	STARTS_WITH_AT: /^@/,

	/** Checks if content starts with double dash (flag indicator) */
	STARTS_WITH_DOUBLE_DASH: /^--/,

	/** Checks if content starts with single dash (potential malformed flag) */
	STARTS_WITH_SINGLE_DASH: /^-/,
} as const;
