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

	it('should replace a single placeholder in content', async () => {
		const mockDoc = {
			uri: { fsPath: '/test/workspace/.brainy/temp/document.md' },
			getText: vi.fn()
		};
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		mockApi.getVariable = vi.fn().mockImplementation((name) => {
			if (name === 'poem') return 'Roses are red.';
			return undefined;
		});

		documentSkill.execute(mockApi, { content: 'Here is a poem: {{poem}}' });

		// Wait for next tick to let initial write happen
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(fs.writeFileSync).toHaveBeenCalledWith(
			'/test/workspace/.brainy/temp/document.md',
			'Here is a poem: Roses are red.',
			'utf-8'
		);
	});

	it('should replace multiple placeholders in content', async () => {
		const mockDoc = {
			uri: { fsPath: '/test/workspace/.brainy/temp/document.md' },
			getText: vi.fn()
		};
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		mockApi.getVariable = vi.fn().mockImplementation((name) => {
			if (name === 'name') return 'Alice';
			if (name === 'city') return 'Wonderland';
			return undefined;
		});

		documentSkill.execute(mockApi, { content: 'Hello {{name}}, welcome to {{city}}.' });

		// Wait for next tick to let initial write happen
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(fs.writeFileSync).toHaveBeenCalledWith(
			'/test/workspace/.brainy/temp/document.md',
			'Hello Alice, welcome to Wonderland.',
			'utf-8'
		);
	});

	it('should leave unknown placeholders unchanged', async () => {
		const mockDoc = {
			uri: { fsPath: '/test/workspace/.brainy/temp/document.md' },
			getText: vi.fn()
		};
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		mockApi.getVariable = vi.fn().mockReturnValue(undefined);

		documentSkill.execute(mockApi, { content: 'Hello {{unknown}}.' });

		// Wait for next tick to let initial write happen
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(fs.writeFileSync).toHaveBeenCalledWith(
			'/test/workspace/.brainy/temp/document.md',
			'Hello {{unknown}}.',
			'utf-8'
		);
	});

	it('should handle content with no placeholders', async () => {
		const mockDoc = {
			uri: { fsPath: '/test/workspace/.brainy/temp/document.md' },
			getText: vi.fn()
		};
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		mockApi.getVariable = vi.fn();

		documentSkill.execute(mockApi, { content: 'No placeholders here.' });

		// Wait for next tick to let initial write happen
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(fs.writeFileSync).toHaveBeenCalledWith(
			'/test/workspace/.brainy/temp/document.md',
			'No placeholders here.',
			'utf-8'
		);
	});

	it('should handle adjacent placeholders', async () => {
		const mockDoc = {
			uri: { fsPath: '/test/workspace/.brainy/temp/document.md' },
			getText: vi.fn()
		};
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		mockApi.getVariable = vi.fn().mockImplementation((name) => {
			if (name === 'a') return 'A';
			if (name === 'b') return 'B';
			return undefined;
		});

		documentSkill.execute(mockApi, { content: '{{a}}{{b}}' });

		// Wait for next tick to let initial write happen
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(fs.writeFileSync).toHaveBeenCalledWith(
			'/test/workspace/.brainy/temp/document.md',
			'AB',
			'utf-8'
		);
	});
});
