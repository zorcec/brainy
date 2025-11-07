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
import { SkillHoverProvider } from './markdown/skillHoverProvider';
import { BrainyCompletionProvider } from './markdown/completionProvider';
import { PlaybookCodeLensProvider, registerPlaybookCommands } from './markdown/playButton';
import { refreshSkills } from './skills/skillScanner';
import { getAllBuiltInSkills, registerSkills } from './skills';
import { registerSkillsAsTools } from './skills/toolRegistration';

// Helper function to safely join paths
function joinPath(base: string, ...parts: string[]): string {
  // In web environment, use simple string concatenation with forward slashes
  // In Node.js environment, use path module if available
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const path = require('path');
      return path.join(base, ...parts);
    } catch {
      // Fallback to manual join
    }
  }
  
  // Manual path joining for web environment
  const normalizedParts = [base, ...parts].filter(Boolean);
  return normalizedParts.join('/').replace(/\/+/g, '/');
}

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('=== Brainy Extension: Starting Activation ===');
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const brainyPath = joinPath(workspaceRoot, '.brainy');
    
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
  // Start the Brainy server in tests / Node environment when available
  try {
    startBrainyServer();
    console.log('Brainy server start requested');
  } catch (err) {
    // If startBrainyServer is not available in this environment, ignore
    const e: any = err;
    console.log('startBrainyServer not started:', e?.message || e);
  }

  // Register annotation highlighting for markdown files
  console.log('Registering annotation highlighting...');
  const legend = createLegend();
  const highlightProvider = new AnnotationHighlightProvider();
  const errorHoverProvider = new AnnotationErrorHoverProvider();
  const skillHoverProvider = new SkillHoverProvider();

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: 'markdown' },
      highlightProvider,
      legend
    )
  );

  // Register hover providers (error hover takes precedence, then skill info)
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      errorHoverProvider
    )
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      skillHoverProvider
    )
  );

  // Register completion provider for autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'markdown' },
      new BrainyCompletionProvider(),
      '@', '-', '"' // Trigger characters
    )
  );

  console.log('✓ Annotation highlighting and hover providers registered for markdown files');

  // Initialize skill parameters registry with built-in skills
  console.log('Initializing skill parameters registry...');
  const builtInSkills = getAllBuiltInSkills();
  registerSkills(builtInSkills);
  console.log(`✓ Registered ${builtInSkills.length} built-in skills in parameters registry`);

  // Register skills as tools (only those with registerAsTool: true)
  console.log('Registering skills as tools...');
  const toolDisposables = await registerSkillsAsTools(builtInSkills);
  context.subscriptions.push(...toolDisposables);
  console.log(`✓ Registered ${toolDisposables.length} skills as tools`);

  // Initialize skills scanner with built-in skills only
  console.log('Setting up skills scanner...');
  refreshSkills();
  console.log('✓ Built-in skills loaded');

  // Register play button for .brainy.md files
  console.log('Registering CodeLens provider for .brainy.md files...');
  const playbookProvider = new PlaybookCodeLensProvider();
  
  // Register with a single pattern that matches .brainy.md files
  // Using language: 'markdown' with pattern works for both file and test environments
  const codeLensDisposable = vscode.languages.registerCodeLensProvider(
    { language: 'markdown', pattern: '**/*.brainy.md' },
    playbookProvider
  );
  context.subscriptions.push(codeLensDisposable);
  console.log('Registered CodeLens provider for .brainy.md files');
  
  registerPlaybookCommands(context, playbookProvider);
  console.log('✓ CodeLens provider registered');
  
  // Force CodeLens refresh when files are opened
  // workspace.onDidOpenTextDocument may not be implemented in some test mocks
  const onDidOpen = (vscode.workspace as any).onDidOpenTextDocument;
  if (typeof onDidOpen === 'function') {
    context.subscriptions.push(
      onDidOpen((document: any) => {
        if (document?.fileName && document.fileName.endsWith('.brainy.md')) {
          console.log('Opened .brainy.md file:', document.fileName);
          playbookProvider.refresh();
        }
      })
    );
  }

    // Register command to run the currently opened playbook
    context.subscriptions.push(
      vscode.commands.registerCommand('brainy.runCurrentPlaybook', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.brainy.md')) {
          vscode.window.showErrorMessage('No .brainy.md playbook is currently open.');
          return;
        }
        // Use the playbookProvider to run the playbook for the current file
        try {
          // If playbookProvider has a public runPlaybook method, use it; otherwise, simulate the play button logic
          if (typeof (playbookProvider as any).runPlaybook === 'function') {
            await (playbookProvider as any).runPlaybook(editor.document);
          } else if (typeof (playbookProvider as any).executePlaybook === 'function') {
            await (playbookProvider as any).executePlaybook(editor.document);
          } else {
            vscode.window.showErrorMessage('Playbook execution method not found.');
          }
        } catch (err) {
          const e: any = err;
          vscode.window.showErrorMessage('Failed to run playbook: ' + (e?.message || e));
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
      const brainyPath = joinPath(workspaceRoot, '.brainy');
      
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
  try {
    stopBrainyServer();
    console.log('Brainy server stop requested');
  } catch (err) {
    const e: any = err;
    console.log('stopBrainyServer not called:', e?.message || e);
  }
}
