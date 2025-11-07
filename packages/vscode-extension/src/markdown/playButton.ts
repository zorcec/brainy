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
import { getExecutionState, setExecutionState, resetExecutionState } from './executionState';
import { clearExecutionDecorations } from './executionDecorations';
import { executePlaybook, stopPlaybookExecution } from './playbookExecutor';

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
 * CodeLens provider that adds play, pause, and stop buttons on the first line of .brainy.md files
 */
export class PlaybookCodeLensProvider implements vscode.CodeLensProvider {
	/**
	 * Public method to run the playbook for a given document
	 */
	public async runPlaybook(document: vscode.TextDocument): Promise<void> {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
			vscode.window.showErrorMessage('No active editor found for the playbook');
			return;
		}

		const editorUri = document.uri.toString();
		// Check current state
		const currentState = getExecutionState(editorUri);
		if (currentState !== 'idle' && currentState !== 'error') {
			vscode.window.showWarningMessage('Playbook is already running or paused');
			return;
		}

		// Clear previous error decorations
		clearErrorDecorations(editor);

		// Parse the playbook
		const content = document.getText();
		const result = parsePlaybook(content);

		// Check for errors
		if (result.errors.length > 0) {
			highlightErrors(editor, result.errors);
			vscode.window.showErrorMessage(
				`Cannot play: Playbook has ${result.errors.length} error(s). Please fix them first.`
			);
			return;
		}

		// Set state to running
		setExecutionState(editorUri, 'running');
		this.refresh();

		// Show result in output channel
		const outputChannel = vscode.window.createOutputChannel('Brainy Playbook');
		outputChannel.clear();
		outputChannel.appendLine('=== Brainy Playbook Execution Started ===\n');
		outputChannel.appendLine(`Blocks to execute: ${result.blocks.length}`);
		outputChannel.show(true);

		vscode.window.showInformationMessage(
			`Playbook execution started with ${result.blocks.length} block(s).`
		);

		// Execute playbook
		try {
			await executePlaybook(
				editor,
				result.blocks,
				// onProgress
				(stepIndex, block, skillResult) => {
					outputChannel.appendLine(`Step ${stepIndex + 1}/${result.blocks.length}: ${block.name}`);
					if (skillResult) {
						outputChannel.appendLine(`Result: ${JSON.stringify(skillResult, null, 2)}`);
					}
				},
				// onError
				(stepIndex, block, error) => {
					outputChannel.appendLine(`\nError at step ${stepIndex + 1}: ${error.message}`);
					vscode.window.showErrorMessage(`Playbook execution failed at step ${stepIndex + 1}: ${error.stack}`);
					this.refresh();
				},
				// onComplete
				() => {
					outputChannel.appendLine('\n=== Playbook Execution Completed ===');
					vscode.window.showInformationMessage('Playbook execution completed successfully.');
					this.refresh();
				}
			);
		} catch (error) {
			console.error('Unexpected error during playbook execution:', error);
			resetExecutionState(editorUri);
			this.refresh();
			vscode.window.showErrorMessage('Unexpected error during playbook execution');
		}
	}
	/**
	 * Event emitter for CodeLens changes
	 */
	private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

	/**
	 * Provides CodeLens for the document (play, pause, stop buttons on first line)
	 */
	public provideCodeLenses(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.CodeLens[]> {
		console.log('provideCodeLenses called for:', document.fileName);
		
		// Only show buttons for .brainy.md files
		if (!document.fileName.endsWith('.brainy.md')) {
			console.log('Skipping - not a .brainy.md file');
			return [];
		}

		console.log('Creating CodeLens for .brainy.md file');

		const firstLine = new vscode.Range(0, 0, 0, 0);
		const editorUri = document.uri.toString();
		const state = getExecutionState(editorUri);
		
		// Check for parse errors to determine if play should be enabled
		const content = document.getText();
		const parseResult = parsePlaybook(content);
		const hasErrors = parseResult.errors.length > 0;

		const codeLenses: vscode.CodeLens[] = [];

		// Only show buttons that are currently enabled
		if (state === 'idle' || state === 'error') {
			// In idle or error state, show Play button (enabled only if no errors)
			if (!hasErrors) {
				codeLenses.push(new vscode.CodeLens(firstLine, {
					title: '$(play) Play',
					command: 'brainy.playbook.play',
					arguments: [document.uri],
				}));
			}
		} else if (state === 'running') {
			// In running state, show Pause and Stop buttons
			codeLenses.push(new vscode.CodeLens(firstLine, {
				title: '$(debug-pause) Pause',
				command: 'brainy.playbook.pause',
				arguments: [document.uri],
			}));

			codeLenses.push(new vscode.CodeLens(firstLine, {
				title: '$(debug-stop) Stop',
				command: 'brainy.playbook.stop',
				arguments: [document.uri],
			}));
		} else if (state === 'paused') {
			// In paused state, show Resume and Stop buttons
			codeLenses.push(new vscode.CodeLens(firstLine, {
				title: '$(debug-pause) Resume',
				command: 'brainy.playbook.pause',
				arguments: [document.uri],
			}));

			codeLenses.push(new vscode.CodeLens(firstLine, {
				title: '$(debug-stop) Stop',
				command: 'brainy.playbook.stop',
				arguments: [document.uri],
			}));
		}

		console.log('CodeLens created:', { count: codeLenses.length, state, hasErrors });
		return codeLenses;
	}

	/**
	 * Refresh CodeLens display
	 */
	public refresh(): void {
		this._onDidChangeCodeLenses.fire();
	}
}

/**
 * Registers the playbook commands (play, pause, stop)
 */
export function registerPlaybookCommands(context: vscode.ExtensionContext, codeLensProvider: PlaybookCodeLensProvider): void {
	console.log('Registering playbook commands...');
	
	// Register the play command
		const playCommand = vscode.commands.registerCommand(
			'brainy.playbook.play',
			async (uri: vscode.Uri) => {
				console.log('Play command triggered for:', uri.toString());
				const document = await vscode.workspace.openTextDocument(uri);
				await codeLensProvider.runPlaybook(document);
			}
		);

	// Register the pause command
	const pauseCommand = vscode.commands.registerCommand(
		'brainy.playbook.pause',
		async (uri: vscode.Uri) => {
			console.log('Pause command triggered for:', uri.toString());
			
			const editorUri = uri.toString();
			const currentState = getExecutionState(editorUri);
			
			if (currentState === 'running') {
				setExecutionState(editorUri, 'paused');
				codeLensProvider.refresh();
				vscode.window.showInformationMessage('Playbook execution paused.');
			} else if (currentState === 'paused') {
				// Resume
				setExecutionState(editorUri, 'running');
				codeLensProvider.refresh();
				vscode.window.showInformationMessage('Playbook execution resumed.');
			}
		}
	);

	// Register the stop command
	const stopCommand = vscode.commands.registerCommand(
		'brainy.playbook.stop',
		async (uri: vscode.Uri) => {
			console.log('Stop command triggered for:', uri.toString());
			
			const document = await vscode.workspace.openTextDocument(uri);
			const editor = vscode.window.activeTextEditor;

			if (!editor || editor.document.uri.toString() !== uri.toString()) {
				vscode.window.showErrorMessage('No active editor found for the playbook');
				return;
			}

			// Stop execution
			stopPlaybookExecution(editor);
			
			// Refresh CodeLens
			codeLensProvider.refresh();
			
			vscode.window.showInformationMessage('Playbook execution stopped.');
		}
	);

	context.subscriptions.push(playCommand, pauseCommand, stopCommand);
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
