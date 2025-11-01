/**
 * Module: markdown/playbookParser.ts
 *
 * Description:
 *   Pure function wrapper around the Brainy markdown parser for playbook execution.
 *   This module provides a simple interface for parsing playbook content and returning
 *   structured blocks and errors. It is used by the play button to parse the current
 *   markdown file and log the result.
 *
 * Usage:
 *   import { parsePlaybook } from './playbookParser';
 *   const result = parsePlaybook(markdownContent);
 *   console.log('Parsed playbook:', JSON.stringify(result, null, 2));
 */

import { parseAnnotations, type ParseResult } from '../parser';

/**
 * Parses playbook markdown content and returns structured blocks and errors.
 * This is a pure function that wraps the core parser for playbook-specific use.
 *
 * @param markdown - The markdown content to parse
 * @returns ParseResult with blocks and errors
 */
export function parsePlaybook(markdown: string): ParseResult {
	return parseAnnotations(markdown);
}
