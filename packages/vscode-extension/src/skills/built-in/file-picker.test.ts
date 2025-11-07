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
		expect(filePickerSkill.params).toHaveLength(4);
		
		const paramNames = filePickerSkill.params?.map(p => p.name);
		expect(paramNames).toContain('variable');
		expect(paramNames).toContain('files');
		expect(paramNames).toContain('folders');
		expect(paramNames).toContain('multiple');
		
		const variableParam = filePickerSkill.params?.find(p => p.name === 'variable');
		expect(variableParam?.required).toBe(true);
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
			canSelectFolders: false,
			canSelectMany: true
		});
		expect(mockApi.setVariable).toHaveBeenCalledWith('selectedFiles', 'Files selected\n- /path/to/file1.txt\n- /path/to/file2.txt');
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('agent');
		expect(result.messages[0].content).toContain('2 files');
	});

	it('should handle single file selection', async () => {
		const mockUris = [
			{ fsPath: '/path/to/file.txt' } as any
		];
		
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selectedFile',
			multiple: 'false'
		});

		expect(mockApi.openFileDialog).toHaveBeenCalledWith({
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: false
		});
		expect(mockApi.setVariable).toHaveBeenCalledWith('selectedFile', 'Files selected\n- /path/to/file.txt');
		expect(result.messages[0].content).toContain('1 file');
		expect(result.messages[0].content).not.toContain('files');
	});

	it('should handle folder selection', async () => {
		const mockUris = [
			{ fsPath: '/path/to/folder' } as any
		];
		
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selectedFolder',
			files: 'false',
			folders: 'true',
			multiple: 'false'
		});

		expect(mockApi.openFileDialog).toHaveBeenCalledWith({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false
		});
		expect(result.messages[0].content).toContain('1 folder');
	});

	it('should handle both files and folders selection', async () => {
		const mockUris = [
			{ fsPath: '/path/to/file.txt' } as any,
			{ fsPath: '/path/to/folder' } as any
		];
		
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selected',
			files: 'true',
			folders: 'true'
		});

		expect(mockApi.openFileDialog).toHaveBeenCalledWith({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});
		expect(result.messages[0].content).toContain('2 items');
	});

	it('should handle user cancellation gracefully', async () => {
		mockApi.openFileDialog = vi.fn(async () => undefined);

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selectedFiles'
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('agent');
		expect(result.messages[0].content).toContain('cancelled');
	});

	it('should handle empty selection gracefully', async () => {
		mockApi.openFileDialog = vi.fn(async () => []);

		const result = await filePickerSkill.execute(mockApi, {
			variable: 'selectedFiles'
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].content).toContain('cancelled');
	});

	it('should throw error if variable is missing', async () => {
		await expect(filePickerSkill.execute(mockApi, {})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if variable is empty', async () => {
		await expect(filePickerSkill.execute(mockApi, {
			variable: ''
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if variable is whitespace only', async () => {
		await expect(filePickerSkill.execute(mockApi, {
			variable: '   '
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if variable is not a string', async () => {
		await expect(filePickerSkill.execute(mockApi, {
			variable: 123 as any
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should parse boolean parameters correctly - true variations', async () => {
		const mockUris = [{ fsPath: '/path/to/file.txt' } as any];
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		// Test 'true'
		await filePickerSkill.execute(mockApi, {
			variable: 'test',
			folders: 'true'
		});
		expect(mockApi.openFileDialog).toHaveBeenLastCalledWith({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});

		// Test '1'
		await filePickerSkill.execute(mockApi, {
			variable: 'test',
			folders: '1'
		});
		expect(mockApi.openFileDialog).toHaveBeenLastCalledWith({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});

		// Test 'yes'
		await filePickerSkill.execute(mockApi, {
			variable: 'test',
			folders: 'yes'
		});
		expect(mockApi.openFileDialog).toHaveBeenLastCalledWith({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});
	});

	it('should parse boolean parameters correctly - false variations', async () => {
		const mockUris = [{ fsPath: '/path/to/file.txt' } as any];
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		// Test 'false'
		await filePickerSkill.execute(mockApi, {
			variable: 'test',
			files: 'false'
		});
		expect(mockApi.openFileDialog).toHaveBeenLastCalledWith({
			canSelectFiles: false,
			canSelectFolders: false,
			canSelectMany: true
		});

		// Test '0'
		await filePickerSkill.execute(mockApi, {
			variable: 'test',
			files: '0'
		});
		expect(mockApi.openFileDialog).toHaveBeenLastCalledWith({
			canSelectFiles: false,
			canSelectFolders: false,
			canSelectMany: true
		});

		// Test 'no'
		await filePickerSkill.execute(mockApi, {
			variable: 'test',
			files: 'no'
		});
		expect(mockApi.openFileDialog).toHaveBeenLastCalledWith({
			canSelectFiles: false,
			canSelectFolders: false,
			canSelectMany: true
		});
	});

	it('should use default values when parameters are not provided', async () => {
		const mockUris = [{ fsPath: '/path/to/file.txt' } as any];
		mockApi.openFileDialog = vi.fn(async () => mockUris);
		mockApi.setVariable = vi.fn();

		await filePickerSkill.execute(mockApi, {
			variable: 'test'
		});

		expect(mockApi.openFileDialog).toHaveBeenCalledWith({
			canSelectFiles: true,  // default
			canSelectFolders: false,  // default
			canSelectMany: true  // default
		});
	});

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

		const expectedPaths = 'Files selected\n- /path/to/file with spaces.txt\n- /path/to/file-with-dashes.txt\n- /path/to/file_with_underscores.txt';
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

		expect(mockApi.setVariable).toHaveBeenCalledWith('selectedFile', 'Files selected\n- C:\\Users\\test\\file.txt');
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

		expect(result.messages[0].content).toContain('100 files');
		
		const storedPaths = (mockApi.setVariable as any).mock.calls[0][1];
		// New format has "Files selected" header + 100 file lines = 101 lines total
		expect(storedPaths.split('\n')).toHaveLength(101);
	});
});
