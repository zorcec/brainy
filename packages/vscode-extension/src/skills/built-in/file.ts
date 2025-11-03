/**
 * Module: skills/built-in/file.ts
 *
 * Description:
 *   Built-in file manipulation skill for Brainy.
 *   Supports read, write, and delete operations on files.
 *   Uses Node.js fs.promises API for file system access (no VS Code APIs).
 *   Runs in an isolated Node.js process.
 *
 * Usage in playbooks:
 *   @file --action "read" --path "./notes.md"
 *   @file --action "write" --path "./output.txt" --content "hello world"
 *   @file --action "delete" --path "./temp.txt"
 *
 * Parameters:
 *   - action: "read" | "write" | "delete"
 *   - path: File path (relative to project root or absolute)
 *   - content: File content (required for write action)
 */

import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Parameters passed to skill execution.
 */
type SkillParams = Record<string, string | undefined>;

/**
 * API provided to skills (not used by this skill).
 */
interface SkillApi {
	sendRequest(role: 'user' | 'assistant', content: string, modelId?: string): Promise<{ response: string }>;
	selectChatModel(modelId: string): Promise<void>;
}

/**
 * Skill interface.
 */
interface Skill {
	name: string;
	description: string;
	execute(api: SkillApi, params: SkillParams): Promise<string>;
}

/**
 * File skill implementation.
 */
export const fileSkill: Skill = {
	name: 'file',
	description: 'Read, write and delete files.',
	
	async execute(api: SkillApi, params: SkillParams): Promise<string> {
		// Defensive: params must be an object
		if (!params || typeof params !== 'object') {
			throw new Error('Invalid params: must be an object');
		}
		const { action, path: filePath, content } = params;

		// Validate action parameter
		if (!action) {
			throw new Error('Missing required parameter: action');
		}
		if (action !== 'read' && action !== 'write' && action !== 'delete') {
			throw new Error(`Invalid action: ${action}. Must be one of: read, write, delete`);
		}
		// Validate path parameter
		if (!filePath) {
			throw new Error('Missing required parameter: path');
		}
		// Validate content for write action
		if (action === 'write' && content === undefined) {
			throw new Error('Missing required parameter for write action: content');
		}

		// Resolve file path (relative paths are resolved from process.cwd(), which is set to project root)
		const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

		// Execute action
		switch (action) {
			case 'read':
				return await readFile(resolvedPath);
			case 'write':
				return await writeFile(resolvedPath, content!);
			case 'delete':
				return await deleteFile(resolvedPath);
			default:
				// TypeScript should prevent this, but just in case
				throw new Error(`Unsupported action: ${action}`);
		}
	}
};

/**
 * Reads a file and returns its contents as a string.
 *
 * @param filePath - Absolute file path to read
 * @returns File contents as string
 */
async function readFile(filePath: string): Promise<string> {
	try {
		const content = await fs.readFile(filePath, 'utf8');
		return content;
	} catch (error) {
		throw new Error(
			`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Writes content to a file.
 * Creates parent directories if they don't exist.
 *
 * @param filePath - Absolute file path to write
 * @param content - Content to write
 * @returns Success message
 */
async function writeFile(filePath: string, content: string): Promise<string> {
	try {
		// Create parent directories if they don't exist
		const dir = path.dirname(filePath);
		await fs.mkdir(dir, { recursive: true });
		
		// Write the file
		await fs.writeFile(filePath, content, 'utf8');
		return `File written successfully: ${filePath}`;
	} catch (error) {
		throw new Error(
			`Failed to write file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Deletes a file.
 *
 * @param filePath - Absolute file path to delete
 * @returns Success message
 */
async function deleteFile(filePath: string): Promise<string> {
	try {
		await fs.unlink(filePath);
		return `File deleted successfully: ${filePath}`;
	} catch (error) {
		throw new Error(
			`Failed to delete file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
