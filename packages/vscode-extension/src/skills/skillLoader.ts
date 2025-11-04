/**
 * Module: skills/skillLoader.ts
 *
 * Description:
 *   Skill loader for loading and executing skills in isolated Node.js processes.
 *   Supports both built-in skills (shipped with extension) and project skills (.brainy/skills).
 *   Built-in skills always take priority over project skills.
 *   Each skill runs in an isolated process with only Node.js APIs available.
 *   The working directory is set to the project root for each skill process.
 *
 * Usage:
 *   import { loadSkill, executeSkill } from './skills/skillLoader';
 *   
 *   const skillMeta = await loadSkill('file', workspaceUri);
 *   const result = await executeSkill(skillMeta, { action: 'read', path: './test.txt' }, workspaceUri);
 */

import * as vscode from 'vscode';
import { fork, ChildProcess } from 'child_process';
import * as path from 'path';
import { SkillParams, SkillResult } from './types';
import { isBuiltInSkill } from './built-in';
import { sendRequest as modelSendRequest } from './modelClient';
import { setSelectedModel } from './sessionStore';

/**
 * Skill metadata (returned by loadSkill).
 * Contains the path to the skill file and basic metadata.
 */
export interface SkillMetadata {
	name: string;
	skillPath: string;
	isBuiltIn: boolean;
}

/**
 * Loads a skill by name and returns metadata.
 * First checks built-in skills, then attempts to load from project's .brainy/skills directory.
 *
 * @param skillName - Name of the skill to load
 * @param workspaceUri - Workspace root URI (required for project skills and determining project root)
 * @returns Promise resolving to the skill metadata
 * @throws Error if the skill cannot be found or loaded
 */
export async function loadSkill(skillName: string, workspaceUri?: vscode.Uri): Promise<SkillMetadata> {
	if (!skillName || typeof skillName !== 'string') {
		throw new Error('Skill name must be a non-empty string');
	}

	// Check built-in skills first
	if (isBuiltInSkill(skillName)) {
		const builtInPath = path.join(__dirname, 'built-in', `${skillName}.ts`);
		return {
			name: skillName,
			skillPath: builtInPath,
			isBuiltIn: true
		};
	}

	// Attempt to load from project skills
	if (!workspaceUri) {
		throw new Error(`Skill '${skillName}' not found. No workspace URI provided for project skills.`);
	}

	return await loadProjectSkill(skillName, workspaceUri);
}

/**
 * Loads a project skill from .brainy/skills directory.
 * Supports both .js and .ts files.
 *
 * @param skillName - Name of the skill to load
 * @param workspaceUri - Workspace root URI
 * @returns Promise resolving to the skill metadata
 * @throws Error if the skill cannot be found or loaded
 */
async function loadProjectSkill(skillName: string, workspaceUri: vscode.Uri): Promise<SkillMetadata> {
	// Try .ts first, then .js
	const extensions = ['.ts', '.js'];
	
	for (const ext of extensions) {
		const skillPath = vscode.Uri.joinPath(workspaceUri, '.brainy', 'skills', `${skillName}${ext}`).fsPath;
		
		try {
			// Check if file exists
			const fileUri = vscode.Uri.file(skillPath);
			await vscode.workspace.fs.stat(fileUri);
			
			return {
				name: skillName,
				skillPath,
				isBuiltIn: false
			};
			
		} catch (error) {
			// If file doesn't exist, try next extension
			if ((error as any).code === 'FileNotFound') {
				continue;
			}
			
			// Other errors should be thrown
			throw new Error(
				`Failed to load project skill '${skillName}' from ${skillPath}: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
	
	// Skill not found
	throw new Error(`Skill '${skillName}' not found in .brainy/skills directory`);
}

/**
 * Executes a skill in an isolated Node.js process.
 *
 * @param skillMeta - The skill metadata from loadSkill
 * @param params - Parameters to pass to the skill
 * @param workspaceUri - Workspace root URI (used to set working directory)
 * @returns Promise resolving to the skill result (SkillResult object)
 * @throws Error if skill execution fails
 */
export async function executeSkill(
	skillMeta: SkillMetadata,
	params: SkillParams,
	workspaceUri: vscode.Uri
): Promise<SkillResult> {
	if (!skillMeta || !skillMeta.skillPath) {
		throw new Error('Invalid skill metadata');
	}

	if (!workspaceUri) {
		throw new Error('Workspace URI is required for skill execution');
	}

	const projectRoot = workspaceUri.fsPath;
	const skillProcessPath = path.join(__dirname, 'skillProcess.js'); // Use .js (compiled output)

	return new Promise((resolve, reject) => {
		// Fork the skill process with working directory set to project root
		const child = fork(skillProcessPath, [], {
			cwd: projectRoot,
			stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
			env: { ...process.env, NODE_ENV: 'production' }
		});

		let resolved = false;

		// Handle messages from the child process
		child.on('message', async (message: any) => {
			if (!message || typeof message !== 'object') {
				return;
			}

			// Handle result
			if (message.type === 'result') {
				resolved = true;
				child.kill();
				resolve(message.result);
				return;
			}

			// Handle error
			if (message.type === 'error') {
				resolved = true;
				child.kill();
				reject(new Error(message.error));
				return;
			}

			// Handle sendRequest from skill
			if (message.type === 'request') {
				try {
					const { requestId, role, content, modelId } = message;
					const response = await modelSendRequest({ role, content, modelId });
					child.send({ type: 'response', requestId, response: response.reply });
				} catch (error) {
					child.send({
						type: 'request-error',
						requestId: message.requestId,
						error: error instanceof Error ? error.message : String(error)
					});
				}
				return;
			}

			// Handle selectChatModel from skill
			if (message.type === 'select-model') {
				try {
					const { requestId, modelId } = message;
					setSelectedModel(modelId);
					child.send({ type: 'model-selected', requestId });
				} catch (error) {
					child.send({
						type: 'model-error',
						requestId: message.requestId,
						error: error instanceof Error ? error.message : String(error)
					});
				}
				return;
			}
		});

		// Handle process errors
		child.on('error', (error) => {
			if (!resolved) {
				resolved = true;
				reject(new Error(`Skill process error: ${error.message}`));
			}
		});

		// Handle process exit
		child.on('exit', (code, signal) => {
			if (!resolved) {
				resolved = true;
				if (code !== 0) {
					reject(new Error(`Skill process exited with code ${code}`));
				} else if (signal) {
					reject(new Error(`Skill process killed with signal ${signal}`));
				} else {
					reject(new Error('Skill process exited without result'));
				}
			}
		});

		// Send execute command to child process
		child.send({
			type: 'execute',
			skillPath: skillMeta.skillPath,
			params
		});

		// Timeout after 60 seconds
		setTimeout(() => {
			if (!resolved) {
				resolved = true;
				child.kill();
				reject(new Error('Skill execution timeout (60s)'));
			}
		}, 60000);
	});
}

/**
 * Convenience function to load and execute a skill in one call.
 *
 * @param skillName - Name of the skill to execute
 * @param params - Parameters to pass to the skill
 * @param workspaceUri - Workspace root URI (required for project skills)
 * @returns Promise resolving to the skill result (SkillResult object)
 */
export async function runSkill(
	skillName: string,
	params: SkillParams,
	workspaceUri: vscode.Uri
): Promise<SkillResult> {
	const skillMeta = await loadSkill(skillName, workspaceUri);
	return await executeSkill(skillMeta, params, workspaceUri);
}

/**
 * Resets the skill loader state. Used for testing.
 */
export function resetSkillLoader(): void {
	// No state to reset in the new implementation
	// Process isolation means no shared state
}
