/**
 * Module: skills/built-in/file.ts
 *
 * Description:
 *   Built-in file manipulation skill for Brainy.
 *   Supports read, write, and delete operations on files.
 *   Uses Node.js fs.promises API for file system access.
 *   Executes in-process.
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

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';

// Conditional imports for Node.js-only environments
let fs: typeof import('fs').promises;
let path: typeof import('path');
try {
	fs = require('fs').promises;
	path = require('path');
} catch {
	// Node.js modules not available in browser/web environments
}

/**
 * File skill implementation.
 */
export const fileSkill: Skill = {
	name: 'file',
	description: 'Read, write and delete files.',
	params: [
		{ name: 'action', description: 'Action to perform (read|write|delete)', required: true },
		{ name: 'path', description: 'File path (relative or absolute)', required: true },
		{ name: 'content', description: 'File content (required for write action)', required: false }
	],
	registerAsTool: true,
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		// Check if fs is available (Node.js environment)
		if (!fs) {
			throw new Error('File skill is not available in web/browser environments. This skill requires Node.js.');
		}
		
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

		// Execute action and get result message
		let operationDesc: string;
		let resultContent: string | null = null;
		
		switch (action) {
			case 'read':
				resultContent = await readFile(resolvedPath);
				operationDesc = 'read';
				break;
			case 'write':
				await writeFile(resolvedPath, content!);
				operationDesc = 'write';
				break;
			case 'delete':
				await deleteFile(resolvedPath);
				operationDesc = 'delete';
				break;
			default:
				// TypeScript should prevent this, but just in case
				throw new Error(`Unsupported action: ${action}`);
		}
		
		// Return result as SkillResult
		// For read operations, return file content as assistant message
		// For write/delete, return operation description as agent message
		const messages: Array<{ role: 'user' | 'assistant' | 'agent'; content: string }> = [];
		
		if (action === 'read' && resultContent !== null) {
			// Read: return content as assistant message
			messages.push({
				role: 'assistant',
				content: resultContent
			});
		}
		
		// Always add agent message with operation description and filename
		const agentMessage = `File ${operationDesc}: ${filePath}`;
		messages.push({
			role: 'agent',
			content: agentMessage
		});
		
		return { messages };
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
 */
async function writeFile(filePath: string, content: string): Promise<void> {
	try {
		// Create parent directories if they don't exist
		const dir = path.dirname(filePath);
		await fs.mkdir(dir, { recursive: true });
		
		// Write the file
		await fs.writeFile(filePath, content, 'utf8');
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
 */
async function deleteFile(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
	} catch (error) {
		throw new Error(
			`Failed to delete file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
