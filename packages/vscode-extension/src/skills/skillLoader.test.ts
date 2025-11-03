/**
 * Module: skills/skillLoader.test.ts
 *
 * Description:
 *   Unit tests for the skill loader.
 *   Tests loading of both built-in and project skills.
 *   Execution tests are limited due to process isolation - full tests are in e2e.
 *   
 * Note: executeSkill spawns child processes and is tested in e2e tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Uri } from 'vscode';

// Mock vscode before imports
vi.mock('vscode', () => ({
	Uri: {
		file: (path: string) => ({ fsPath: path }),
		joinPath: (base: any, ...segments: string[]) => ({
			fsPath: `${base.fsPath}/${segments.join('/')}`
		})
	},
	workspace: {
		fs: {
			stat: vi.fn()
		}
	}
}));

import { loadSkill, resetSkillLoader, SkillMetadata } from './skillLoader';
import { SkillParams } from './types';

beforeEach(() => {
	resetSkillLoader();
});

afterEach(() => {
	resetSkillLoader();
});

describe('skillLoader', () => {
	describe('loadSkill', () => {
		it('should load built-in skill by name', async () => {
			const skillMeta = await loadSkill('file');
			expect(skillMeta).toBeDefined();
			expect(skillMeta.name).toBe('file');
			expect(skillMeta.isBuiltIn).toBe(true);
			expect(skillMeta.skillPath).toContain('file.ts');
		});

		it('should throw error for invalid skill name', async () => {
			await expect(loadSkill('')).rejects.toThrow('Skill name must be a non-empty string');
		});

		it('should throw error for non-existent skill without workspace', async () => {
			await expect(loadSkill('non-existent')).rejects.toThrow('not found');
		});
	});

	describe('skill metadata', () => {
		it('should return metadata with correct structure', async () => {
			const skillMeta = await loadSkill('file');
			expect(skillMeta).toHaveProperty('name');
			expect(skillMeta).toHaveProperty('skillPath');
			expect(skillMeta).toHaveProperty('isBuiltIn');
			expect(typeof skillMeta.name).toBe('string');
			expect(typeof skillMeta.skillPath).toBe('string');
			expect(typeof skillMeta.isBuiltIn).toBe('boolean');
		});
	});

	// Note: executeSkill tests are in e2e tests because they spawn child processes
	// Unit tests for process isolation would require complex mocking
});
