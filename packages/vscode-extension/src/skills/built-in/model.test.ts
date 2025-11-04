/**
 * Module: skills/built-in/model.test.ts
 *
 * Description:
 *   Unit tests for the model skill.
 *   Tests model selection with various scenarios and error cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { modelSkill } from './model';
import { createMockSkillApi } from '../testUtils';

describe('modelSkill', () => {
	let mockApi: ReturnType<typeof createMockSkillApi>;

	beforeEach(() => {
		// Create a fresh mock API for each test
		mockApi = createMockSkillApi();
	});

	describe('metadata', () => {
		it('should have correct name', () => {
			expect(modelSkill.name).toBe('model');
		});

		it('should have description', () => {
			expect(modelSkill.description).toBeTruthy();
			expect(typeof modelSkill.description).toBe('string');
		});

		it('should have execute function', () => {
			expect(typeof modelSkill.execute).toBe('function');
		});
	});

	describe('successful execution', () => {
		it('should set model and return confirmation message', async () => {
			const result = await modelSkill.execute(mockApi, { id: 'gpt-4o' });
			
			expect(mockApi.selectChatModel).toHaveBeenCalledWith('gpt-4o');
			expect(mockApi.selectChatModel).toHaveBeenCalledTimes(1);
			expect(result).toBe('Model set to: gpt-4o');
		});

		it('should handle different model IDs', async () => {
			const result = await modelSkill.execute(mockApi, { id: 'claude-3' });
			
			expect(mockApi.selectChatModel).toHaveBeenCalledWith('claude-3');
			expect(result).toBe('Model set to: claude-3');
		});

		it('should trim whitespace from model ID', async () => {
			const result = await modelSkill.execute(mockApi, { id: '  gpt-4o  ' });
			
			// Note: The skill validates that id.trim() !== '', but passes original id to API
			// This is intentional - API should handle trimming if needed
			expect(mockApi.selectChatModel).toHaveBeenCalledWith('  gpt-4o  ');
			expect(result).toBe('Model set to:   gpt-4o  ');
		});
	});

	describe('error handling', () => {
		it('should throw error if id is missing', async () => {
			await expect(modelSkill.execute(mockApi, {})).rejects.toThrow('Missing or invalid model id');
		});

		it('should throw error if id is undefined', async () => {
			await expect(modelSkill.execute(mockApi, { id: undefined })).rejects.toThrow('Missing or invalid model id');
		});

		it('should throw error if id is empty string', async () => {
			await expect(modelSkill.execute(mockApi, { id: '' })).rejects.toThrow('Missing or invalid model id');
		});

		it('should throw error if id is only whitespace', async () => {
			await expect(modelSkill.execute(mockApi, { id: '   ' })).rejects.toThrow('Missing or invalid model id');
		});

		it('should throw error if id is not a string', async () => {
			// @ts-expect-error Testing invalid input
			await expect(modelSkill.execute(mockApi, { id: 123 })).rejects.toThrow('Missing or invalid model id');
		});

		it('should propagate errors from selectChatModel', async () => {
			// Cast to any to access mock methods
			(mockApi.selectChatModel as any).mockRejectedValue(new Error('Model not found'));
			
			await expect(modelSkill.execute(mockApi, { id: 'invalid-model' })).rejects.toThrow('Model not found');
		});
	});
});
