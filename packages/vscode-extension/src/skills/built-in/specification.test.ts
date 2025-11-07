/**
 * Unit tests for the specification skill
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { specificationSkill } from './specification';
import type { SkillApi } from '../types';

// Mock vscode modules
vi.mock('vscode', () => ({
	workspace: {
		openTextDocument: vi.fn(),
		onDidCloseTextDocument: vi.fn(),
		onWillSaveTextDocument: vi.fn()
	},
	window: {
		showTextDocument: vi.fn(),
		onDidChangeVisibleTextEditors: vi.fn(),
		showInformationMessage: vi.fn()
	}
}));

describe('Specification Skill', () => {
	let mockApi: SkillApi;

	beforeEach(() => {
		mockApi = {
			setVariable: vi.fn(),
			getVariable: vi.fn(),
			addToContext: vi.fn(),
			sendRequest: vi.fn()
		} as unknown as SkillApi;

		vi.clearAllMocks();
	});

	it('should have correct metadata', () => {
		expect(specificationSkill.name).toBe('specification');
		expect(specificationSkill.description).toContain('document');
		expect(specificationSkill.params).toHaveLength(2);
		expect(specificationSkill.params?.[0].name).toBe('variable');
		expect(specificationSkill.params?.[1].name).toBe('content');
	});

	it('should open document with initial content', async () => {
		const mockDoc = {
			getText: vi.fn().mockReturnValue('Test content'),
			isDirty: false
		};

		const mockEditor = {};

		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue(mockEditor as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.workspace.onWillSaveTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		// Start execution (it returns a promise that resolves when document closes)
		// We don't await it because it waits for user to close the document
		specificationSkill.execute(mockApi, { content: 'Initial content' });

		// Wait for next tick to let promises settle
		await new Promise(resolve => setTimeout(resolve, 10));

		// Verify document was opened with correct parameters
		expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith({
			content: 'Initial content',
			language: 'markdown'
		});

		expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockDoc);

		// Note: The promise doesn't resolve until document is closed
		// In actual use, the document close event will trigger resolution
	});

	it('should use empty content when not provided', async () => {
		const mockDoc = {
			getText: vi.fn().mockReturnValue(''),
			isDirty: false
		};

		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.workspace.onWillSaveTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		// Don't await - it waits for user interaction
		specificationSkill.execute(mockApi, {});

		// Wait for next tick
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith({
			content: '',
			language: 'markdown'
		});
	});

	it('should register event listeners for document close', async () => {
		const mockDoc = {
			getText: vi.fn().mockReturnValue(''),
			isDirty: false
		};

		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);
		vi.mocked(vscode.window.showTextDocument).mockResolvedValue({} as any);
		vi.mocked(vscode.workspace.onDidCloseTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.workspace.onWillSaveTextDocument).mockReturnValue({ dispose: vi.fn() } as any);
		vi.mocked(vscode.window.onDidChangeVisibleTextEditors).mockReturnValue({ dispose: vi.fn() } as any);

		// Don't await - it waits for user interaction
		specificationSkill.execute(mockApi, {});

		// Wait for next tick
		await new Promise(resolve => setTimeout(resolve, 10));

		// Verify event listeners were registered
		expect(vscode.workspace.onDidCloseTextDocument).toHaveBeenCalled();
		expect(vscode.workspace.onWillSaveTextDocument).toHaveBeenCalled();
		expect(vscode.window.onDidChangeVisibleTextEditors).toHaveBeenCalled();
	});
});
