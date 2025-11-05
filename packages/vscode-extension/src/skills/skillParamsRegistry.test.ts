/**
 * Tests for skill parameters registry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	registerSkill,
	registerSkills,
	getSkillParams,
	getAllSkillNames,
	clearRegistry,
	getRegistrySize
} from './skillParamsRegistry';
import type { Skill } from './types';

describe('skillParamsRegistry', () => {
	// Reset registry before each test
	beforeEach(() => {
		clearRegistry();
	});

	describe('registerSkill', () => {
		it('should register a skill with parameters', () => {
			const skill: Skill = {
				name: 'test',
				description: 'Test skill',
				params: [
					{ name: 'param1', description: 'First parameter', required: true },
					{ name: 'param2', description: 'Second parameter', required: false }
				],
				execute: async () => ({ messages: [] })
			};

			registerSkill(skill);

			const params = getSkillParams('test');
			expect(params).toBeDefined();
			expect(params).toHaveLength(2);
			expect(params![0].name).toBe('param1');
			expect(params![0].required).toBe(true);
			expect(params![1].name).toBe('param2');
			expect(params![1].required).toBe(false);
		});

		it('should register a skill without parameters', () => {
			const skill: Skill = {
				name: 'test',
				description: 'Test skill',
				execute: async () => ({ messages: [] })
			};

			registerSkill(skill);

			const params = getSkillParams('test');
			expect(params).toBeDefined();
			expect(params).toHaveLength(0);
		});

		it('should overwrite existing skill registration', () => {
			const skill1: Skill = {
				name: 'test',
				description: 'Test skill',
				params: [{ name: 'old', description: 'Old param', required: false }],
				execute: async () => ({ messages: [] })
			};

			const skill2: Skill = {
				name: 'test',
				description: 'Test skill v2',
				params: [{ name: 'new', description: 'New param', required: true }],
				execute: async () => ({ messages: [] })
			};

			registerSkill(skill1);
			registerSkill(skill2);

			const params = getSkillParams('test');
			expect(params).toHaveLength(1);
			expect(params![0].name).toBe('new');
		});
	});

	describe('registerSkills', () => {
		it('should register multiple skills at once', () => {
			const skills: Skill[] = [
				{
					name: 'skill1',
					description: 'First skill',
					params: [{ name: 'param1', description: 'Param 1', required: true }],
					execute: async () => ({ messages: [] })
				},
				{
					name: 'skill2',
					description: 'Second skill',
					params: [{ name: 'param2', description: 'Param 2', required: false }],
					execute: async () => ({ messages: [] })
				}
			];

			registerSkills(skills);

			expect(getSkillParams('skill1')).toHaveLength(1);
			expect(getSkillParams('skill2')).toHaveLength(1);
			expect(getRegistrySize()).toBe(2);
		});
	});

	describe('getSkillParams', () => {
		it('should return undefined for unregistered skill', () => {
			const params = getSkillParams('nonexistent');
			expect(params).toBeUndefined();
		});

		it('should return parameters for registered skill', () => {
			const skill: Skill = {
				name: 'file',
				description: 'File operations',
				params: [
					{ name: 'action', description: 'Action to perform', required: true },
					{ name: 'path', description: 'File path', required: true },
					{ name: 'content', description: 'File content', required: false }
				],
				execute: async () => ({ messages: [] })
			};

			registerSkill(skill);

			const params = getSkillParams('file');
			expect(params).toHaveLength(3);
			expect(params![0].name).toBe('action');
			expect(params![1].name).toBe('path');
			expect(params![2].name).toBe('content');
		});
	});

	describe('getAllSkillNames', () => {
		it('should return empty array for empty registry', () => {
			const names = getAllSkillNames();
			expect(names).toHaveLength(0);
		});

		it('should return all registered skill names', () => {
			const skills: Skill[] = [
				{ name: 'skill1', description: 'S1', execute: async () => ({ messages: [] }) },
				{ name: 'skill2', description: 'S2', execute: async () => ({ messages: [] }) },
				{ name: 'skill3', description: 'S3', execute: async () => ({ messages: [] }) }
			];

			registerSkills(skills);

			const names = getAllSkillNames();
			expect(names).toHaveLength(3);
			expect(names).toContain('skill1');
			expect(names).toContain('skill2');
			expect(names).toContain('skill3');
		});
	});

	describe('clearRegistry', () => {
		it('should clear all registered skills', () => {
			const skills: Skill[] = [
				{ name: 'skill1', description: 'S1', execute: async () => ({ messages: [] }) },
				{ name: 'skill2', description: 'S2', execute: async () => ({ messages: [] }) }
			];

			registerSkills(skills);
			expect(getRegistrySize()).toBe(2);

			clearRegistry();
			expect(getRegistrySize()).toBe(0);
			expect(getAllSkillNames()).toHaveLength(0);
		});
	});

	describe('built-in skills integration', () => {
		it('should work with task skill parameters', () => {
			const taskSkill: Skill = {
				name: 'task',
				description: 'Execute a task',
				params: [
					{ name: 'prompt', description: 'Task prompt', required: true },
					{ name: 'model', description: 'Model to use', required: false },
					{ name: 'variable', description: 'Variable to store result', required: false }
				],
				execute: async () => ({ messages: [] })
			};

			registerSkill(taskSkill);

			const params = getSkillParams('task');
			expect(params).toHaveLength(3);
			expect(params!.map(p => p.name)).toEqual(['prompt', 'model', 'variable']);
		});

		it('should work with file skill parameters', () => {
			const fileSkill: Skill = {
				name: 'file',
				description: 'File operations',
				params: [
					{ name: 'action', description: 'Action to perform', required: true },
					{ name: 'path', description: 'File path', required: true },
					{ name: 'content', description: 'File content', required: false }
				],
				execute: async () => ({ messages: [] })
			};

			registerSkill(fileSkill);

			const params = getSkillParams('file');
			expect(params).toHaveLength(3);
			
			// Check required flags
			const requiredParams = params!.filter(p => p.required);
			expect(requiredParams).toHaveLength(2);
			expect(requiredParams.map(p => p.name)).toEqual(['action', 'path']);
		});
	});
});
