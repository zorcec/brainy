/**
 * Module: markdown/executeDiagnostics.ts
 *
 * Description:
 *   Provides real-time validation for @execute annotations in playbook files.
 *   Validates that @execute annotations are immediately followed by a code block.
 *   Shows diagnostics in the editor when validation fails.
 *
 * Features:
 *   - Real-time validation on document changes
 *   - Inline diagnostics with squiggly underlines
 *   - Problems panel integration
 *   - Clear, actionable error messages
 */

import * as vscode from 'vscode';
import { parseAnnotations, type AnnotationBlock } from '../parser';

/**
 * Validates @execute annotations and updates diagnostics.
 *
 * @param document - The text document to validate
 * @param diagnosticCollection - The diagnostic collection to update
 */
export function validateExecuteAnnotations(
	document: vscode.TextDocument,
	diagnosticCollection: vscode.DiagnosticCollection
): void {
	// Only validate .brainy.md files
	if (!document.fileName.endsWith('.brainy.md')) {
		diagnosticCollection.delete(document.uri);
		return;
	}

	const diagnostics: vscode.Diagnostic[] = [];
	const text = document.getText();
	
	try {
		const parseResult = parseAnnotations(text);
		const blocks = parseResult.blocks;

		// Find all @execute blocks and validate them
		for (let i = 0; i < blocks.length; i++) {
			const block = blocks[i];
			
			if (block.name === 'execute') {
				const nextBlock = blocks[i + 1];
				
				// Check if next block exists and is a code block
				if (!nextBlock) {
					// No block after @execute
					const diagnostic = createExecuteDiagnostic(
						document,
						block,
						'No code block found after @execute annotation. Add a code block (e.g., triple backticks with language) immediately after @execute.'
					);
					diagnostics.push(diagnostic);
				} else if (nextBlock.name !== 'plainCodeBlock') {
					// Next block is not a code block
					const diagnostic = createExecuteDiagnostic(
						document,
						block,
						`Expected code block after @execute, but found '${nextBlock.name}'. Add a code block (e.g., triple backticks with language) immediately after @execute.`
					);
					diagnostics.push(diagnostic);
				} else if (!nextBlock.metadata?.language) {
					// Code block exists but has no language
					const diagnostic = createExecuteDiagnostic(
						document,
						nextBlock,
						'Code block is missing language identifier. Specify a language after the opening triple backticks (e.g., bash, javascript, python).'
					);
					diagnostics.push(diagnostic);
				}
			}
		}
	} catch (error) {
		// If parsing fails, don't show diagnostics
		console.error('Failed to parse document for execute validation:', error);
	}

	// Update diagnostics for this document
	diagnosticCollection.set(document.uri, diagnostics);
}

/**
 * Creates a diagnostic for an @execute validation error.
 *
 * @param document - The text document
 * @param block - The block with the error
 * @param message - The error message
 * @returns A diagnostic object
 */
function createExecuteDiagnostic(
	document: vscode.TextDocument,
	block: AnnotationBlock,
	message: string
): vscode.Diagnostic {
	// Convert 1-indexed line to 0-indexed
	const lineIndex = (block.line || 1) - 1;
	
	// Ensure line index is valid
	const validLineIndex = Math.max(0, Math.min(lineIndex, document.lineCount - 1));
	const line = document.lineAt(validLineIndex);
	
	// Create range for the entire line or the @execute annotation
	const range = new vscode.Range(
		validLineIndex,
		0,
		validLineIndex,
		line.text.length
	);

	const diagnostic = new vscode.Diagnostic(
		range,
		message,
		vscode.DiagnosticSeverity.Error
	);

	diagnostic.source = 'brainy';
	diagnostic.code = 'execute-missing-code-block';

	return diagnostic;
}

/**
 * Creates a diagnostic collection and sets up document change listeners.
 *
 * @param context - The extension context
 * @returns Disposable for cleanup
 */
export function setupExecuteDiagnostics(context: vscode.ExtensionContext): vscode.Disposable {
	// Create diagnostic collection
	const diagnosticCollection = vscode.languages.createDiagnosticCollection('brainy-execute');
	context.subscriptions.push(diagnosticCollection);

	// Validate all open documents on startup
	vscode.workspace.textDocuments.forEach(document => {
		validateExecuteAnnotations(document, diagnosticCollection);
	});

	// Validate when documents are opened
	const onDidOpenDisposable = vscode.workspace.onDidOpenTextDocument(document => {
		validateExecuteAnnotations(document, diagnosticCollection);
	});
	context.subscriptions.push(onDidOpenDisposable);

	// Validate when documents change
	const onDidChangeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
		validateExecuteAnnotations(event.document, diagnosticCollection);
	});
	context.subscriptions.push(onDidChangeDisposable);

	// Clear diagnostics when documents are closed
	const onDidCloseDisposable = vscode.workspace.onDidCloseTextDocument(document => {
		diagnosticCollection.delete(document.uri);
	});
	context.subscriptions.push(onDidCloseDisposable);

	return diagnosticCollection;
}
