/**
 * Module: activation/initializeSkills.ts
 *
 * Initializes the skills system:
 * - Registers built-in skills in the parameters registry
 * - Registers skills as VS Code tools
 * - Sets up skill scanning for local .skills/ folder
 * - Watches for skill file changes
 */

import * as vscode from 'vscode';
import { refreshSkills, watchSkillFiles } from '../skills/skillScanner';
import { getAllBuiltInSkills, registerSkills } from '../skills';
import { registerSkillsAsTools } from '../skills/toolRegistration';

/**
 * Initializes the skills system.
 * 
 * @param context - The extension context
 * @param workspaceRoot - The workspace root path (optional)
 */
export async function initializeSkills(
    context: vscode.ExtensionContext,
    workspaceRoot?: string
): Promise<void> {
    // Register built-in skills in parameters registry
    const builtInSkills = getAllBuiltInSkills();
    registerSkills(builtInSkills);
    console.log(`✓ Registered ${builtInSkills.length} built-in skills`);

    // Register skills as VS Code tools (only those with registerAsTool: true)
    const toolDisposables = await registerSkillsAsTools(builtInSkills);
    context.subscriptions.push(...toolDisposables);
    console.log(`✓ Registered ${toolDisposables.length} skills as tools`);

    // Initialize skills scanner
    if (workspaceRoot) {
        refreshSkills(workspaceRoot);
        console.log('✓ Built-in and local skills loaded');

        // Watch for changes in .skills/ folder
        try {
            const watcher = watchSkillFiles(workspaceRoot, () => {
                console.log('Local skills changed, refreshing...');
                refreshSkills(workspaceRoot);
            });
            context.subscriptions.push(watcher);
            console.log('✓ Watching .skills/ folder for changes');
        } catch (err) {
            console.warn('Failed to setup skill file watcher:', err);
        }
    } else {
        refreshSkills();
        console.log('✓ Built-in skills loaded (no workspace)');
    }
}
