/**
 * Module: skills/skillLoader.test.ts
 *
 * Description:
 *   Unit tests for the skill loader.
 *   Tests loading and execution of built-in skills in-process.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadSkill, executeSkill, resetSkillLoader } from './skillLoader';

// Mock vscode module
vi.mock('vscode', () => ({
	window: {
		showInformationMessage: vi.fn(),
		showErrorMessage: vi.fn(),
	},
	workspace: {
		workspaceFolders: [],
		fs: {
			readFile: vi.fn(),
			writeFile: vi.fn(),
		},
	},
	Uri: {
		file: (path: string) => ({ fsPath: path, path }),
	},
}));

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
			expect(skill.execute).toBeDefined();
			expect(typeof skill.execute).toBe('function');
		});

		it('should throw error for invalid skill name', async () => {
			await expect(loadSkill('')).rejects.toThrow('Skill name must be a non-empty string');
		});

		it('should throw error for non-existent skill', async () => {
			await expect(loadSkill('non-existent')).rejects.toThrow('not found');
		});
	});

	describe('skill metadata', () => {
		it('should return skill with correct structure', async () => {
			const skill = await loadSkill('file');
			expect(skill).toHaveProperty('name');
			expect(skill).toHaveProperty('description');
			expect(skill).toHaveProperty('execute');
			expect(typeof skill.name).toBe('string');
			expect(typeof skill.description).toBe('string');
			expect(typeof skill.execute).toBe('function');
		});
	});

	describe('executeSkill', () => {
		it('should execute built-in skill in-process', async () => {
			const skill = await loadSkill('file');
			const result = await executeSkill(skill, { 
				action: 'write',
				path: '/tmp/test.txt',
				content: 'test content'
			});
			
			expect(result).toBeDefined();
			expect(result.messages).toBeDefined();
			expect(Array.isArray(result.messages)).toBe(true);
		});

		it('should throw error for invalid skill', async () => {
			await expect(executeSkill(null as any, {})).rejects.toThrow('Invalid skill');
		});
	});
});

