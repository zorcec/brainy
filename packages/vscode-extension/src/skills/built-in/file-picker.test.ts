/**
 * Tests for the file-picker skill.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { filePickerSkill } from './file-picker';
import { createMockSkillApi } from '../testUtils';
import type { SkillApi } from '../types';

describe('file-picker skill', () => {
	let mockApi: SkillApi;

	beforeEach(() => {
		mockApi = createMockSkillApi();
	});

	it('should have correct name and description', () => {
		expect(filePickerSkill.name).toBe('file-picker');
		expect(filePickerSkill.description).toBeTruthy();
		expect(filePickerSkill.description).toContain('file');
	});

	it('should have correct parameters', () => {
		expect(filePickerSkill.params).toBeDefined();
		expect(filePickerSkill.params).toHaveLength(2);
		
		const paramNames = filePickerSkill.params?.map(p => p.name);
		expect(paramNames).toContain('variable');
		expect(paramNames).toContain('prompt');
		
		const variableParam = filePickerSkill.params?.find(p => p.name === 'variable');
		expect(variableParam?.required).toBe(false);
	});

	it('should select files and store paths in variable', async () => {
		const mockUris = [
			{ fsPath: '/path/to/file1.txt' } as any,
			{ fsPath: '/path/to/file2.txt' } as any
		];
		
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selectedFiles'
		});

		expect(mockApi.openFileDialog).toHaveBeenCalledWith({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});
	expect(mockApi.setVariable).toHaveBeenCalledWith('selectedFiles', '- /path/to/file1.txt\n- /path/to/file2.txt');
	expect(result.messages).toHaveLength(1);
	expect(result.messages[0].role).toBe('agent');
	expect(result.messages[0].content).toContain('- /path/to/file1.txt');
	expect(result.messages[0].content).toContain('- /path/to/file2.txt');
	});

	it('should handle single file selection', async () => {
		const mockUris = [
			{ fsPath: '/path/to/file.txt' } as any
		];
		
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selectedFile'
		});

		expect(mockApi.openFileDialog).toHaveBeenCalledWith({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});
	expect(mockApi.setVariable).toHaveBeenCalledWith('selectedFile', '- /path/to/file.txt');
	expect(result.messages[0].content).toContain('- /path/to/file.txt');
	});

	it('should handle folder selection and label directories', async () => {
		const mockUris = [
			{ fsPath: '/path/to/folder' } as any
		];
		
		// Mock fs.lstatSync to report this path as a directory
		const fs = require('fs');
		const lstatSpy = vi.spyOn(fs, 'lstatSync').mockImplementation((...args: any[]) => {
			const p = args[0] as string;
			return { isDirectory: () => true } as any;
		});

		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selectedFolder'
		});

		expect(mockApi.openFileDialog).toHaveBeenCalledWith({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});

	expect(result.messages[0].content).toContain('- /path/to/folder/ (directory)');

		lstatSpy.mockRestore();
	});

	it('should handle mixed files and folders selection', async () => {
		const mockUris = [
			{ fsPath: '/path/to/file.txt' } as any,
			{ fsPath: '/path/to/folder' } as any
		];
		
		// Mock fs.lstatSync to return true for folder path only
		const fs = require('fs');
		const realLstat = fs.lstatSync;
		const lstatSpy = vi.spyOn(fs, 'lstatSync').mockImplementation((...args: any[]) => {
			const p = args[0] as string;
			return { isDirectory: () => p.endsWith('folder') } as any;
		});

		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selected'
		});

		expect(mockApi.openFileDialog).toHaveBeenCalledWith({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});
	expect(result.messages[0].content).toContain('- /path/to/file.txt');
	expect(result.messages[0].content).toContain('- /path/to/folder/ (directory)');

		lstatSpy.mockRestore();
	});

	it('should handle user cancellation gracefully', async () => {
		mockApi.openFileDialog = vi.fn(async () => undefined);

		const result = await filePickerSkill.execute(mockApi, {});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('agent');
		expect(result.messages[0].content).toContain('cancelled');
	});

	it('should handle empty selection gracefully', async () => {
		mockApi.openFileDialog = vi.fn(async () => []);

		const result = await filePickerSkill.execute(mockApi, {});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].content).toContain('cancelled');
	});

	it('should not require variable; if omitted no variable is set', async () => {
		const mockUris = [
			{ fsPath: '/path/to/file1.txt' } as any
		];
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {});

	expect(mockApi.setVariable).not.toHaveBeenCalled();
	expect(result.messages[0].content).toContain('- /path/to/file1.txt');
	});

	// Removed boolean flag parsing tests because flags were removed from the skill. Selection now always allows files, folders and multiple items.

	it('should handle paths with special characters', async () => {
		const mockUris = [
			{ fsPath: '/path/to/file with spaces.txt' } as any,
			{ fsPath: '/path/to/file-with-dashes.txt' } as any,
			{ fsPath: '/path/to/file_with_underscores.txt' } as any
		];
		
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		await filePickerSkill.execute(mockApi, {
			variable: 'selectedFiles'
		});

	const expectedPaths = '- /path/to/file with spaces.txt\n- /path/to/file-with-dashes.txt\n- /path/to/file_with_underscores.txt';
	expect(mockApi.setVariable).toHaveBeenCalledWith('selectedFiles', expectedPaths);
	});

	it('should handle Windows-style paths', async () => {
		const mockUris = [
			{ fsPath: 'C:\\Users\\test\\file.txt' } as any
		];
		
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		await filePickerSkill.execute(mockApi, {
			variable: 'selectedFile'
		});

	expect(mockApi.setVariable).toHaveBeenCalledWith('selectedFile', '- C:\\Users\\test\\file.txt');
	});

	it('should handle many files selection', async () => {
		const mockUris = Array.from({ length: 100 }, (_, i) => ({
			fsPath: `/path/to/file${i}.txt`
		} as any));
		
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'manyFiles'
		});

	// Ensure the message contains the last file and the stored paths have 100 lines
	expect(result.messages[0].content).toContain('- /path/to/file99.txt');

	const storedPaths = (mockApi.setVariable as any).mock.calls[0][1];
	expect(storedPaths.split('\n')).toHaveLength(100);
	});
});
