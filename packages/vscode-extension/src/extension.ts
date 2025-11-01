/**
 * Brainy VS Code Extension
 * 
 * Extension that integrates with the Brainy server for knowledge management.
 */

import * as vscode from 'vscode';
import { startBrainyServer, stopBrainyServer } from './brainyServerManager';
import {
  AnnotationHighlightProvider,
  AnnotationErrorHoverProvider,
  createLegend
} from './markdown/annotationHighlightProvider';
import { PlaybookCodeLensProvider, registerPlaybookCommands } from './markdown/playButton';

// Check if path module is available (Node.js environment)
let pathModule: any;
try {
  pathModule = require('path');
} catch {
  // path not available in web environment
}

/**
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('=== Brainy Extension: Starting Activation ===');
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    let brainyPath = workspaceRoot;
    
    if (pathModule) {
      brainyPath = pathModule.join(workspaceRoot, '.brainy');
    }
    
    console.log('Workspace root:', workspaceRoot);
    console.log('Brainy path:', brainyPath);
    
    try {
      vscode.window.showInformationMessage('Brainy Extension Activated!');
    } catch (error) {
      console.error('Failed to configure Brainy database:', error);
      vscode.window.showErrorMessage('Failed to initialize Brainy database');
    }
  } else {
    console.warn('No workspace folder found');
    vscode.window.showWarningMessage('Brainy: No workspace folder found. Please open a workspace.');
  }

  // Start the Brainy server process (only in Node.js environment)
  // Commented out for web compatibility - server not needed for basic extension features
  // console.log('Starting Brainy server...');
  // startBrainyServer();

  // Register annotation highlighting for markdown files
  console.log('Registering annotation highlighting...');
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

  console.log('✓ Annotation highlighting registered for markdown files');

  // Register play button for .brainy.md files
  console.log('Registering CodeLens provider for .brainy.md files...');
  const playbookProvider = new PlaybookCodeLensProvider();
  
  // Try multiple patterns to ensure it matches
  const documentSelectors = [
    { pattern: '**/*.brainy.md' },
    { scheme: 'file', pattern: '**/*.brainy.md' },
    { scheme: 'vscode-test-web', pattern: '**/*.brainy.md' },
    { language: 'markdown', pattern: '**/*.brainy.md' },
  ];
  
  for (const selector of documentSelectors) {
    const codeLensDisposable = vscode.languages.registerCodeLensProvider(
      selector,
      playbookProvider
    );
    context.subscriptions.push(codeLensDisposable);
    console.log('Registered CodeLens with selector:', JSON.stringify(selector));
  }
  
  registerPlaybookCommands(context);
  console.log('✓ CodeLens provider registered for .brainy.md files');
  
  // Force CodeLens refresh when files are opened
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.fileName.endsWith('.brainy.md')) {
        console.log('Opened .brainy.md file:', document.fileName);
        playbookProvider.refresh();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('brainy.configure', async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }
      
      const workspaceRoot = folders[0].uri.fsPath;
      let brainyPath = workspaceRoot;
      
      if (pathModule) {
        brainyPath = pathModule.join(workspaceRoot, '.brainy');
      }
      
      vscode.window.showInformationMessage(`Brainy configured at ${brainyPath}`);
    })
  );
  
  console.log('=== Brainy Extension: Activation Complete ===');
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
  console.log('Deactivating Brainy extension...');
  // Commented out for web compatibility
  // stopBrainyServer();
}
