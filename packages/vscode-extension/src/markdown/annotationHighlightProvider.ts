/**
 * Module: markdown/annotationHighlightProvider.ts
 *
 * Description:
 *   Semantic token provider for highlighting Brainy playbook annotations in Markdown files.
 *   Uses the existing parser to extract annotations and consumes position metadata for tokens.
 *   Supports all annotation types (generic), flags, and parser error highlighting.
 *
 *   The provider is stateless and efficient, processing documents on-demand using parser output.
 *   All tokens are single-line (required by VS Code API) and non-overlapping.
 *
 * Usage:
 *   import { AnnotationHighlightProvider, createLegend } from './markdown/annotationHighlightProvider';
 *   const legend = createLegend();
 *   vscode.languages.registerDocumentSemanticTokensProvider(
 *     { language: 'markdown' },
 *     new AnnotationHighlightProvider(),
 *     legend
 *   );
 */

import * as vscode from 'vscode';
import { parseAnnotations, type AnnotationBlock, type ParserError, type Flag } from '../parser';

/**
 * Token types used for highlighting.
 */
export const TOKEN_TYPES = ['annotation', 'flag', 'error'] as const;

/**
 * Token modifiers (currently unused, but extensible).
 */
export const TOKEN_MODIFIERS: string[] = [];

/**
 * Creates the semantic tokens legend for the provider.
 *
 * @returns SemanticTokensLegend with annotation, flag, and error token types
 */
export function createLegend(): vscode.SemanticTokensLegend {
	return new vscode.SemanticTokensLegend(TOKEN_TYPES as unknown as string[], TOKEN_MODIFIERS);
}

/**
 * Checks if a line number is valid for the document.
 *
 * @param lineNumber - Line number to validate (1-indexed)
 * @param document - Document to validate against
 * @returns true if line number is valid
 */
function isValidLine(lineNumber: number, document: vscode.TextDocument): boolean {
	// Convert to 0-indexed for document API
	const zeroIndexed = lineNumber - 1;
	return zeroIndexed >= 0 && zeroIndexed < document.lineCount;
}

/**
 * Adds a token to the builder with range validation.
 *
 * @param builder - Semantic tokens builder
 * @param line - Line number (1-indexed from parser)
 * @param start - Start character (0-indexed)
 * @param length - Token length
 * @param type - Token type
 */
function addToken(
	builder: vscode.SemanticTokensBuilder,
	line: number,
	start: number,
	length: number,
	type: string
): void {
	// Convert 1-indexed line to 0-indexed for VS Code API
	const zeroIndexedLine = line - 1;
	builder.push(new vscode.Range(zeroIndexedLine, start, zeroIndexedLine, start + length), type, []);
}

/**
 * Semantic token provider for Brainy markdown annotations.
 * Implements DocumentSemanticTokensProvider to provide syntax highlighting.
 */
export class AnnotationHighlightProvider implements vscode.DocumentSemanticTokensProvider {
	/**
	 * Provides semantic tokens for a document.
	 *
	 * @param document - The document to provide tokens for
	 * @returns SemanticTokens or undefined if document is empty
	 */
	provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens | undefined {
		const content = document.getText();
		if (!content?.trim()) {
			return undefined;
		}

		const parseResult = parseAnnotations(content);
		const tokensBuilder = new vscode.SemanticTokensBuilder(createLegend());

		// Add block tokens (annotations and flags)
		for (const block of parseResult.blocks) {
			addBlockTokens(tokensBuilder, document, block);
		}

		// Add error tokens (may overlap, but that's handled by VS Code)
		for (const error of parseResult.errors) {
			addErrorToken(tokensBuilder, document, error);
		}

		return tokensBuilder.build();
	}
}

/**
 * Adds semantic tokens for an annotation block.
 *
 * @param builder - The semantic tokens builder
 * @param document - The document being processed
 * @param block - The annotation block to add tokens for
 */
function addBlockTokens(
	builder: vscode.SemanticTokensBuilder,
	document: vscode.TextDocument,
	block: AnnotationBlock
): void {
	// Skip blocks that shouldn't be highlighted
	const skipTypes = ['plainText', 'plainComment', 'plainCodeBlock'];
	if (skipTypes.includes(block.name)) {
		return;
	}

	// Highlight annotation name if position is available
	if (block.annotationPosition) {
		const { line, start, length } = block.annotationPosition;
		if (isValidLine(line, document)) {
			addToken(builder, line, start, length, 'annotation');
		}
	}

	// Highlight flags using parser-provided positions
	for (const flag of block.flags) {
		// Highlight flag name token
		if (flag.position) {
			const { line, start, length } = flag.position;
			if (isValidLine(line, document)) {
				addToken(builder, line, start, length, 'flag');
			}
		}

		// Highlight quoted value tokens
		if (flag.valuePositions) {
			for (const valuePos of flag.valuePositions) {
				const { line, start, length } = valuePos;
				if (isValidLine(line, document)) {
					addToken(builder, line, start, length, 'flag');
				}
			}
		}
	}
}

/**
 * Adds an error token for a parser error.
 *
 * @param builder - Semantic tokens builder
 * @param document - Document being processed
 * @param error - Parser error
 */
function addErrorToken(
	builder: vscode.SemanticTokensBuilder,
	document: vscode.TextDocument,
	error: ParserError
): void {
	if (!error.line || error.line <= 0) {
		return;
	}

	if (!isValidLine(error.line, document)) {
		return;
	}

	// Convert 1-indexed line to 0-indexed for document API
	const zeroIndexedLine = error.line - 1;
	const line = document.lineAt(zeroIndexedLine);
	
	// Try to highlight specific context, otherwise highlight entire line
	if (error.context) {
		const contextStart = line.text.indexOf(error.context);
		if (contextStart >= 0) {
			addToken(builder, error.line, contextStart, error.context.length, 'error');
			return;
		}
	}

	// Highlight entire non-whitespace portion
	const start = line.firstNonWhitespaceCharacterIndex;
	const length = line.text.trim().length;
	addToken(builder, error.line, start, length, 'error');
}

/**
 * Hover provider for displaying error messages on hover.
 */
export class AnnotationErrorHoverProvider implements vscode.HoverProvider {
	/**
	 * Provides hover information for a position in the document.
	 *
	 * @param document - The document to provide hover for
	 * @param position - The position where hover was triggered
	 * @returns Hover with error message or undefined
	 */
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.Hover | undefined {
		const content = document.getText();
		if (!content?.trim()) {
			return undefined;
		}

		const parseResult = parseAnnotations(content);
		
		// Find errors on the current line (convert to 1-indexed for parser)
		const currentLine = position.line + 1;
		const errorsOnLine = parseResult.errors.filter((error) => error.line === currentLine);

		if (errorsOnLine.length === 0) {
			return undefined;
		}

		// Build formatted error messages
		const messages = errorsOnLine.map(
			(error) => `**${error.type}**: ${error.message} (${error.severity || 'critical'})`
		);

		return new vscode.Hover(messages.join('\n\n'));
	}
}
