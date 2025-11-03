/**
 * Module: skills/built-in/file.test.ts
 *
 * Description:
 *   Unit tests for the file skill.
 *   Tests read, write, and delete operations with various scenarios and error cases.
 *   
 * Note: These tests are skipped in unit test runs because they require actual VS Code API.
 * The file skill is tested in e2e tests instead.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock vscode before imports
vi.mock('vscode', () => ({}));

import { fileSkill } from './file';
import { SkillApi } from '../types';

// Create a mock SkillApi for testing
const mockApi: SkillApi = {
	async sendRequest(role, content, modelId) {
		return { response: `Mock response for: ${content}` };
	},
	async selectChatModel(modelId) {
		// No-op for tests
	}
};

describe('fileSkill', () => {
	describe('metadata', () => {
		it('should have correct name', () => {
			expect(fileSkill.name).toBe('file');
		});

		it('should have description', () => {
			expect(fileSkill.description).toBeTruthy();
			expect(typeof fileSkill.description).toBe('string');
		});

		it('should have execute function', () => {
			expect(typeof fileSkill.execute).toBe('function');
		});
	});

	// Note: Functional tests for file operations are in e2e tests
	// Unit tests cannot easily mock VS Code's workspace.fs API
	describe('parameter validation', () => {
		it('should throw error if action is missing', async () => {
			await expect(fileSkill.execute(mockApi, { path: './test.txt' })).rejects.toThrow('Missing required parameter: action');
		});

		it('should throw error if action is invalid', async () => {
			await expect(fileSkill.execute(mockApi, { action: 'invalid', path: './test.txt' })).rejects.toThrow('Invalid action');
		});

		it('should throw error if path is missing', async () => {
			await expect(fileSkill.execute(mockApi, { action: 'read' })).rejects.toThrow('Missing required parameter: path');
		});

		it('should throw error if content is missing for write action', async () => {
			await expect(fileSkill.execute(mockApi, { action: 'write', path: './test.txt' })).rejects.toThrow('Missing required parameter for write action: content');
		});
	});

	describe('error handling', () => {
		it('should throw error if execute is called with undefined params', async () => {
			// @ts-expect-error
			await expect(fileSkill.execute(mockApi, undefined)).rejects.toThrow();
		});
		it('should throw error if execute is called with null params', async () => {
			// @ts-expect-error
			await expect(fileSkill.execute(mockApi, null)).rejects.toThrow();
		});
		it('should throw error if execute is called with empty object', async () => {
			await expect(fileSkill.execute(mockApi, {})).rejects.toThrow('Missing required parameter: action');
		});
	});
});
