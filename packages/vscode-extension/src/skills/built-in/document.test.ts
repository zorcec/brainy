/**
 * Unit tests for the document skill
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { documentSkill } from './document';
import type { SkillApi } from '../types';

// Mock vscode modules
vi.mock('vscode', () => ({
	workspace: {
		openTextDocument: vi.fn(),
		onDidCloseTextDocument: vi.fn(),
		workspaceFolders: []
	},
	window: {
		showTextDocument: vi.fn(),
		onDidChangeVisibleTextEditors: vi.fn(),
		showInformationMessage: vi.fn()
	},
	Uri: {
		file: (path: string) => ({ fsPath: path })
	}
}));

// Mock fs module
vi.mock('fs', () => ({
	existsSync: vi.fn(),
	mkdirSync: vi.fn(),
	writeFileSync: vi.fn(),
	readFileSync: vi.fn()
}));

describe('Document Skill', () => {
	let mockApi: SkillApi;

	beforeEach(() => {
		mockApi = {
			setVariable: vi.fn(),
			getVariable: vi.fn(),
			addToContext: vi.fn(),
			sendRequest: vi.fn()
		} as unknown as SkillApi;

		vi.clearAllMocks();
		
		// Set up workspace folder mock
		(vscode.workspace as any).workspaceFolders = [
			{ uri: { fsPath: '/test/workspace' } }
		];
	});

	it('should have correct metadata', () => {
		expect(documentSkill.name).toBe('document');
		expect(documentSkill.description).toContain('document');
		expect(documentSkill.params).toHaveLength(2);
		expect(documentSkill.params?.[0].name).toBe('variable');
		expect(documentSkill.params?.[1].name).toBe('content');
	});

	it('should create .brainy/temp directory and document file', async () => {
		const mockDoc = {
			uri: { fsPath: '/test/workspace/.brainy/temp/document.md' },
			getText: vi.fn().mockReturnValue('Test content')
		};

		vi.mocked(fs.existsSync).mockReturnValue(false);
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		// Start execution (it returns a promise that resolves when document closes)
		documentSkill.execute(mockApi, {});

		// Wait for next tick to let promises settle
		await new Promise(resolve => setTimeout(resolve, 10));

		// Verify directory was created
		expect(fs.mkdirSync).toHaveBeenCalledWith(
			'/test/workspace/.brainy/temp',
			{ recursive: true }
		);

		// Verify empty document was written
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			'/test/workspace/.brainy/temp/document.md',
			'',
			'utf-8'
		);

		// Verify document was opened
		expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
			'/test/workspace/.brainy/temp/document.md'
		);
	});

	it('should throw error when no workspace is open', async () => {
		(vscode.workspace as any).workspaceFolders = [];

		await expect(documentSkill.execute(mockApi, {})).rejects.toThrow('No workspace folder open');
	});

	it('should register event listeners for document close', async () => {
		const mockDoc = {
			uri: { fsPath: '/test/workspace/.brainy/temp/document.md' },
			getText: vi.fn().mockReturnValue('')
		};

		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		// Don't await - it waits for user interaction
		documentSkill.execute(mockApi, {});

		// Wait for next tick
		await new Promise(resolve => setTimeout(resolve, 10));

		// Verify event listeners were registered
		expect(vscode.workspace.onDidCloseTextDocument).toHaveBeenCalled();
		expect(vscode.window.onDidChangeVisibleTextEditors).toHaveBeenCalled();
	});
});
