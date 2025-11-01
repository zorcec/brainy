/**
 * Brainy VS Code Extension
 * 
 * Extension that integrates with the Brainy server for knowledge management.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { startBrainyServer, stopBrainyServer } from './brainyServerManager';
import {
  AnnotationHighlightProvider,
  AnnotationErrorHoverProvider,
  createLegend
} from './markdown/annotationHighlightProvider';
import { PlaybookCodeLensProvider, registerPlaybookCommands } from './markdown/playButton';

/**
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Activating Brainy extension...');
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const brainyPath = path.join(workspaceRoot, '.brainy');
    
    try {
      vscode.window.showInformationMessage('Brainy Extension Activated!');
    } catch (error) {
      console.error('Failed to configure Brainy database:', error);
      vscode.window.showErrorMessage('Failed to initialize Brainy database');
    }
  } else {
    vscode.window.showWarningMessage('Brainy: No workspace folder found. Please open a workspace.');
  }

  // Start the Brainy server process
  console.log('Starting Brainy server...');
  startBrainyServer();
  vscode.window.showInformationMessage('Brainy Extension Activated!');

  // Register annotation highlighting for markdown files
  const legend = createLegend();
  const highlightProvider = new AnnotationHighlightProvider();
  const hoverProvider = new AnnotationErrorHoverProvider();

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: 'markdown' },
      highlightProvider,
      legend
    )
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      hoverProvider
    )
  );

  console.log('Annotation highlighting registered for markdown files');

  // Register play button for .brainy.md files
  const playbookProvider = new PlaybookCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/*.brainy.md' },
      playbookProvider
    )
  );
  registerPlaybookCommands(context);
  console.log('Play button registered for .brainy.md files');

  context.subscriptions.push(
    vscode.commands.registerCommand('brainy.configure', async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }
      
      const workspaceRoot = folders[0].uri.fsPath;
      const brainyPath = path.join(workspaceRoot, '.brainy');
      // Here you would send a configure request to the server if needed
      vscode.window.showInformationMessage(`Brainy configured at ${brainyPath}`);
    })
  );
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
  console.log('Deactivating Brainy extension...');
  stopBrainyServer();
}
