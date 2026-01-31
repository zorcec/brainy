/**
 * Brainy VS Code Extension
 * 
 * Extension that integrates with the Brainy server for knowledge management.
 */

import * as vscode from 'vscode';
import { startBrainyServer, stopBrainyServer } from './brainyServerManager';
import { registerProviders, registerCommands, initializeSkills } from './activation';

/**
 * Helper to safely join paths (handles test environment without full vscode.Uri support)
 */
function joinBrainyPath(base: string, ...parts: string[]): string {
  try {
    if (typeof vscode.Uri.file === 'function' && typeof vscode.Uri.joinPath === 'function') {
      return vscode.Uri.joinPath(vscode.Uri.file(base), ...parts).fsPath;
    }
  } catch {
    // Fall through to manual join
  }
  // Fallback: simple path join
  return [base, ...parts].join('/').replace(/\/+/g, '/');
}

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('=== Brainy Extension: Starting Activation ===');

  const workspaceFolders = vscode.workspace.workspaceFolders;
  const workspaceRoot = workspaceFolders?.[0]?.uri.fsPath;

  if (workspaceRoot) {
    const brainyPath = joinBrainyPath(workspaceRoot, '.brainy');
    console.log('Workspace root:', workspaceRoot);
    console.log('Brainy path:', brainyPath);
    vscode.window.showInformationMessage('Brainy Extension Activated!');
  } else {
    console.warn('No workspace folder found');
    vscode.window.showWarningMessage('Brainy: No workspace folder found. Please open a workspace.');
  }

  // Start the Brainy server
  try {
    startBrainyServer();
    console.log('Brainy server start requested');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log('startBrainyServer not started:', message);
  }

  // Register language providers (highlighting, hover, completion, CodeLens)
  const { playbookProvider } = registerProviders(context);

  // Initialize skills system
  await initializeSkills(context, workspaceRoot);

  // Register commands
  registerCommands(context, playbookProvider);

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
    const message = err instanceof Error ? err.message : String(err);
    console.log('stopBrainyServer not called:', message);
  }
}
