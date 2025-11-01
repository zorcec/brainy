/**
 * Module: markdown/playButton.ts
 *
 * Description:
 *   Provides a play button UI for Brainy playbook markdown files using VS Code's CodeLens API.
 *   The play button appears on the first line of .brainy.md files and allows users to parse
 *   the playbook and view the parsed output in the console.
 *
 *   This module also handles error decoration when parser errors are encountered, highlighting
 *   the affected text with inline decorations and showing error messages on hover.
 *
 * Architecture:
 *   - CodeLensProvider: Adds a clickable play button on line 0 of .brainy.md files
 *   - Command handler: Parses the file when the button is clicked and logs the result
 *   - Error decorator: Highlights parser errors with inline decorations and hover tooltips
 *
 * Usage:
 *   ```typescript
 *   import { PlaybookCodeLensProvider, registerPlaybookCommands } from './playButton';
 *   const provider = new PlaybookCodeLensProvider();
 *   context.subscriptions.push(
 *     vscode.languages.registerCodeLensProvider({ pattern: '**\/*.brainy.md' }, provider)
 *   );
 *   registerPlaybookCommands(context);
 *   ```
 */

import * as vscode from 'vscode';
import { parsePlaybook } from './playbookParser';
import type { ParserError } from '../parser';

/**
 * Decoration type for highlighting parser errors inline
 */
let errorDecorationType: vscode.TextEditorDecorationType | undefined;

/**
 * Gets or creates the error decoration type
 */
function getErrorDecorationType(): vscode.TextEditorDecorationType {
	if (!errorDecorationType) {
		errorDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: 'rgba(255, 0, 0, 0.1)',
			borderRadius: '2px',
			border: '1px solid rgba(255, 0, 0, 0.3)',
		});
	}
	return errorDecorationType;
}

/**
 * Highlights parser errors in the editor with inline decorations and hover tooltips
 */
function highlightErrors(editor: vscode.TextEditor, errors: ParserError[]): void {
	const decorations: vscode.DecorationOptions[] = errors
		.filter((error) => error.line !== undefined)
		.map((error) => {
			const line = error.line! - 1;
			const startPos = new vscode.Position(line, 0);
			const endPos = new vscode.Position(line, Number.MAX_SAFE_INTEGER);
			const range = new vscode.Range(startPos, endPos);

		return {
			range,
			hoverMessage: new vscode.MarkdownString(`**Parser Error:** ${error.message}`),
		};
	});

	editor.setDecorations(getErrorDecorationType(), decorations);
}

/**
 * Clears error decorations from the editor
 */
function clearErrorDecorations(editor: vscode.TextEditor): void {
	editor.setDecorations(getErrorDecorationType(), []);
}

/**
 * CodeLens provider that adds a play button on the first line of .brainy.md files
 */
export class PlaybookCodeLensProvider implements vscode.CodeLensProvider {
	/**
	 * Event emitter for CodeLens changes
	 */
	private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

	/**
	 * Provides CodeLens for the document (play button on first line)
	 */
	public provideCodeLenses(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.CodeLens[]> {
		console.log('provideCodeLenses called for:', document.fileName);
		
		// Only show play button for .brainy.md files
		if (!document.fileName.endsWith('.brainy.md')) {
			console.log('Skipping - not a .brainy.md file');
			return [];
		}

		console.log('Creating CodeLens for .brainy.md file');

		// Add play button on the first line
		const firstLine = new vscode.Range(0, 0, 0, 0);
		const codeLens = new vscode.CodeLens(firstLine, {
			title: '$(play) Parse Playbook',
			command: 'brainy.playbook.parse',
			arguments: [document.uri],
		});

		console.log('CodeLens created:', codeLens);
		return [codeLens];
	}

	/**
	 * Refresh CodeLens display
	 */
	public refresh(): void {
		this._onDidChangeCodeLenses.fire();
	}
}

/**
 * Registers the playbook parse command and related commands
 */
export function registerPlaybookCommands(context: vscode.ExtensionContext): void {
	console.log('Registering playbook commands...');
	
	// Register the parse command triggered by the play button
	const parseCommand = vscode.commands.registerCommand(
		'brainy.playbook.parse',
		async (uri: vscode.Uri) => {
			console.log('Parse command triggered for:', uri.toString());
			
			const document = await vscode.workspace.openTextDocument(uri);
			const editor = vscode.window.activeTextEditor;

			if (!editor || editor.document.uri.toString() !== uri.toString()) {
				vscode.window.showErrorMessage('No active editor found for the playbook');
				return;
			}

			// Clear previous error decorations
			clearErrorDecorations(editor);

			// Parse the playbook
			const content = document.getText();
			console.log('Parsing playbook content, length:', content.length);
			const result = parsePlaybook(content);
			console.log('Parse result:', { blockCount: result.blocks.length, errorCount: result.errors.length });

			// Log the result to the console
			console.log('Parsed playbook:', JSON.stringify(result, null, 2));

			// Show result in output channel for better visibility
			const outputChannel = vscode.window.createOutputChannel('Brainy Playbook');
			outputChannel.clear();
			outputChannel.appendLine('=== Brainy Playbook Parse Result ===\n');
			outputChannel.appendLine(JSON.stringify(result, null, 2));
			outputChannel.show(true);

			// Highlight errors if any
			if (result.errors.length > 0) {
				highlightErrors(editor, result.errors);
				vscode.window.showWarningMessage(
					`Playbook parsed with ${result.errors.length} error(s). See output for details.`
				);
			} else {
				vscode.window.showInformationMessage(
					`Playbook parsed successfully with ${result.blocks.length} block(s).`
				);
			}
		}
	);

	context.subscriptions.push(parseCommand);
	console.log('✓ Playbook commands registered');
}

/**
 * Disposes resources used by this module
 */
export function dispose(): void {
	if (errorDecorationType) {
		errorDecorationType.dispose();
		errorDecorationType = undefined;
	}
}
