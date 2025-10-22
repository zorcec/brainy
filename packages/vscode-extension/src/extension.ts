/**
 * Brainy VS Code Extension - Hello World Example
 * 
 * This is a simple extension setup demonstrating the basic structure.
 * Integration with the Brainy server will be added in future iterations.
 */

import * as vscode from 'vscode';

/**
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Activating Brainy extension...');
  vscode.window.showInformationMessage('Brainy Extension Activated!');

  // Register hello world command
  const disposable = vscode.commands.registerCommand('brainy.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from Brainy Knowledge Assistant!');
  });

  context.subscriptions.push(disposable);
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
  console.log('Deactivating Brainy extension...');
}
