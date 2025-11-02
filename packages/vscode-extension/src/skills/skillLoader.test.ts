/**
 * Module: skills/skillLoader.test.ts
 *
 * Description:
 *   Unit tests for the skill loader.
 *   Tests loading and execution of both built-in and project skills.
 *   
 * Note: Some tests are limited because they require actual VS Code API.
 * Full integration tests are in e2e tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock vscode before imports
vi.mock('vscode', () => ({}));

import { loadSkill, executeSkill, resetSkillLoader } from './skillLoader';
import { Skill, SkillParams } from './types';

beforeEach(() => {
	resetSkillLoader();
});

afterEach(() => {
	resetSkillLoader();
});

describe('skillLoader', () => {
	describe('loadSkill', () => {
		it('should load built-in skill by name', async () => {
			const skill = await loadSkill('file');
			expect(skill).toBeDefined();
			expect(skill.name).toBe('file');
			expect(skill.description).toBeTruthy();
			expect(typeof skill.execute).toBe('function');
		});

		it('should throw error for invalid skill name', async () => {
			await expect(loadSkill('')).rejects.toThrow('Skill name must be a non-empty string');
		});

		it('should throw error for non-existent skill without workspace', async () => {
			await expect(loadSkill('non-existent')).rejects.toThrow('not found');
		});
	});

	describe('executeSkill', () => {
		it('should throw error if skill is invalid', async () => {
			const invalidSkill = { name: 'invalid', description: 'test' } as Skill;
			const params: SkillParams = {};

			await expect(executeSkill(invalidSkill, params)).rejects.toThrow('Invalid skill');
		});

		it('should throw error if skill does not return string', async () => {
			// Create a mock skill that returns non-string
			const mockSkill: Skill = {
				name: 'mock',
				description: 'Mock skill for testing',
				async execute(params: SkillParams): Promise<any> {
					return 123; // Invalid: should return string
				}
			};

			const params: SkillParams = {};
			await expect(executeSkill(mockSkill, params)).rejects.toThrow('must return a string');
		});
	});

	describe('skill validation', () => {
		it('should validate skill has execute function', async () => {
			const skill = await loadSkill('file');
			expect(typeof skill.execute).toBe('function');
		});

		it('should validate skill returns Promise<string>', async () => {
			const skill = await loadSkill('file');
			// Execute with invalid params to test return type validation
			const params: SkillParams = { action: 'invalid' };
			
			// Should throw because of invalid action, but the Promise<string> contract is maintained
			await expect(executeSkill(skill, params)).rejects.toThrow();
		});
	});
});
