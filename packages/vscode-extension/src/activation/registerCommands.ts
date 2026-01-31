/**
 * Module: activation/registerCommands.ts
 *
 * Registers all VS Code commands for the Brainy extension:
 * - brainy.configure
 * - brainy.runCurrentPlaybook
 * - brainy.listSkills
 * - brainy.reloadSkills
 */

import * as vscode from 'vscode';
import { PlaybookCodeLensProvider, registerPlaybookCommands } from '../markdown/playButton';
import { refreshSkills, getAvailableSkills, getLocalSkills } from '../skills/skillScanner';
import { isBuiltInSkill } from '../skills';

/**
 * Registers all Brainy commands.
 * 
 * @param context - The extension context
 * @param playbookProvider - The playbook provider for execution commands
 */
export function registerCommands(
    context: vscode.ExtensionContext,
    playbookProvider: PlaybookCodeLensProvider
): void {
    // Register playbook-related commands (play, pause, stop)
    registerPlaybookCommands(context, playbookProvider);

    // Run current playbook command
    context.subscriptions.push(
        vscode.commands.registerCommand('brainy.runCurrentPlaybook', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !editor.document.fileName.endsWith('.brainy.md')) {
                vscode.window.showErrorMessage('No .brainy.md playbook is currently open.');
                return;
            }
            try {
                if (typeof (playbookProvider as any).runPlaybook === 'function') {
                    await (playbookProvider as any).runPlaybook(editor.document);
                } else if (typeof (playbookProvider as any).executePlaybook === 'function') {
                    await (playbookProvider as any).executePlaybook(editor.document);
                } else {
                    vscode.window.showErrorMessage('Playbook execution method not found.');
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage('Failed to run playbook: ' + message);
            }
        })
    );

    // List available skills command
    context.subscriptions.push(
        vscode.commands.registerCommand('brainy.listSkills', async () => {
            const allSkills = getAvailableSkills();
            const localSkillNames = getLocalSkills();

            let message = `**Available Skills (${allSkills.length})**\n\n`;
            message += `**Built-in Skills:** ${allSkills.filter((s: string) => isBuiltInSkill(s)).join(', ')}\n\n`;

            if (localSkillNames.length > 0) {
                message += `**Local Skills:** ${localSkillNames.join(', ')}\n`;
                message += `(from .skills/ folder)`;
            } else {
                message += `**Local Skills:** None found in .skills/ folder`;
            }

            vscode.window.showInformationMessage(message);
        })
    );

    // Reload skills command
    context.subscriptions.push(
        vscode.commands.registerCommand('brainy.reloadSkills', async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder found. Only built-in skills available.');
                refreshSkills();
                return;
            }

            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            refreshSkills(workspaceRoot);

            const localSkills = getLocalSkills();
            vscode.window.showInformationMessage(
                `Skills reloaded! Found ${localSkills.length} local skill(s).`
            );
        })
    );

    // Configure command
    context.subscriptions.push(
        vscode.commands.registerCommand('brainy.configure', async () => {
            const folders = vscode.workspace.workspaceFolders;
            if (!folders || folders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }

            const workspaceRoot = folders[0].uri.fsPath;
            const brainyPath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.brainy').fsPath;
            vscode.window.showInformationMessage(`Brainy configured at ${brainyPath}`);
        })
    );

    console.log('✓ Commands registered');
}
