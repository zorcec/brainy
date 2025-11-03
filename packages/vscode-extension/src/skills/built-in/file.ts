/**
 * Module: skills/built-in/file.ts
 *
 * Description:
 *   Built-in file manipulation skill for Brainy.
 *   Supports read, write, and delete operations on files.
 *   Uses VS Code API for file system access (compatible with both Node.js and Web).
 *
 * Usage in playbooks:
 *   @file --action "read" --path "./notes.md"
 *   @file --action "write" --path "./output.txt" --content "hello world"
 *   @file --action "delete" --path "./temp.txt"
 *
 * Parameters:
 *   - action: "read" | "write" | "delete"
 *   - path: File path (relative to workspace or absolute)
 *   - content: File content (required for write action)
 */

import * as vscode from 'vscode';
import { Skill, SkillParams, SkillApi } from '../types';

// Helper function to resolve file paths (web-compatible)
function resolveFilePath(workspace: vscode.Uri, filePath: string): vscode.Uri {
	// If absolute path (starts with /), use it directly
	if (filePath.startsWith('/')) {
		return vscode.Uri.file(filePath);
	}
	
	// Otherwise, resolve relative to workspace
	// Use VS Code's URI.joinPath which works in both Node and Web
	return vscode.Uri.joinPath(workspace, filePath);
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

	       // Get workspace folder
	       const workspaceFolders = vscode.workspace.workspaceFolders;
	       if (!workspaceFolders || workspaceFolders.length === 0) {
		       throw new Error('No workspace folder open');
	       }

	       // Resolve file URI (support both relative and absolute paths)
	       const fileUri = resolveFileUri(filePath, workspaceFolders[0].uri);

	       // Execute action
	       switch (action) {
		       case 'read':
			       return await readFile(fileUri);
		       case 'write':
			       return await writeFile(fileUri, content!);
		       case 'delete':
			       return await deleteFile(fileUri);
		       default:
			       // TypeScript should prevent this, but just in case
			       throw new Error(`Unsupported action: ${action}`);
	       }
       }
};

/**
 * Resolves a file path to a VS Code URI.
 * Handles both relative and absolute paths.
 *
 * @param filePath - File path (relative or absolute)
 * @param workspaceUri - Workspace root URI
 * @returns Resolved file URI
 */
function resolveFileUri(filePath: string, workspaceUri: vscode.Uri): vscode.Uri {
	return resolveFilePath(workspaceUri, filePath);
}

/**
 * Reads a file and returns its contents as a string.
 *
 * @param fileUri - File URI to read
 * @returns File contents as string
 */
async function readFile(fileUri: vscode.Uri): Promise<string> {
	try {
		const content = await vscode.workspace.fs.readFile(fileUri);
		return new TextDecoder().decode(content);
	} catch (error) {
		throw new Error(
			`Failed to read file ${fileUri.fsPath}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Writes content to a file.
 * Creates parent directories if they don't exist.
 *
 * @param fileUri - File URI to write
 * @param content - Content to write
 * @returns Success message
 */
async function writeFile(fileUri: vscode.Uri, content: string): Promise<string> {
	try {
		const contentBytes = new TextEncoder().encode(content);
		await vscode.workspace.fs.writeFile(fileUri, contentBytes);
		return `File written successfully: ${fileUri.fsPath}`;
	} catch (error) {
		throw new Error(
			`Failed to write file ${fileUri.fsPath}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Deletes a file.
 *
 * @param fileUri - File URI to delete
 * @returns Success message
 */
async function deleteFile(fileUri: vscode.Uri): Promise<string> {
	try {
		await vscode.workspace.fs.delete(fileUri);
		return `File deleted successfully: ${fileUri.fsPath}`;
	} catch (error) {
		throw new Error(
			`Failed to delete file ${fileUri.fsPath}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
