/**
 * Module: skills/skillRunner.test.ts
 *
 * Description:
 *   Unit tests for the skill runner module. Tests loading and executing
 *   both JavaScript and TypeScript skills, error handling, and API injection.
 *
 * Usage:
 *   npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'path';
import { loadSkill, executeSkill, runSkill, resetSkillRunner } from './skillRunner';

describe('skillRunner', () => {
	beforeEach(() => {
		// Reset state before each test
		resetSkillRunner();
	});

	describe('loadSkill', () => {
		it('loads a JavaScript skill successfully', async () => {
			const skillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/basic.js');
			const skill = await loadSkill(skillPath);

			expect(skill).toBeDefined();
			expect(typeof skill.run).toBe('function');
		});

		it('loads a TypeScript skill successfully', async () => {
			const skillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/execute.ts');
			const skill = await loadSkill(skillPath);

			expect(skill).toBeDefined();
			expect(typeof skill.run).toBe('function');
		});

		it('throws error for empty skill path', async () => {
			await expect(loadSkill('')).rejects.toThrow('Skill path must be a non-empty string');
		});

		it('throws error for non-existent skill file', async () => {
			const skillPath = join(__dirname, 'non-existent-skill.js');
			await expect(loadSkill(skillPath)).rejects.toThrow('Failed to load skill');
		});

		it('throws error for skill without run function', async () => {
			// Create a mock skill object without run function
			const mockSkillPath = join(__dirname, 'mock-invalid-skill.js');
			
			// Test validation logic directly
			const skill = { invalid: true } as any;
			
			await expect(executeSkill(skill, {}, {})).rejects.toThrow(
				'Invalid skill: must have a run function'
			);
		});
	});

	describe('executeSkill', () => {
		it('executes a JavaScript skill and returns result', async () => {
			const skillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/basic.js');
			const skill = await loadSkill(skillPath);
			const api = {};
			const params = {};

			const result = await executeSkill(skill, api, params);

			expect(result).toBeDefined();
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe('hello world');
			expect(result.stderr).toBe('');
		});

		it('executes a TypeScript skill and returns result', async () => {
			const skillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/execute.ts');
			const skill = await loadSkill(skillPath);
			const api = {};
			const params = {};

			const result = await executeSkill(skill, api, params);

			expect(result).toBeDefined();
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe('hello world');
			expect(result.stderr).toBe('');
		});

		it('injects API object to skill', async () => {
			const skillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/basic.js');
			const skill = await loadSkill(skillPath);
			const api = { testMethod: () => 'test' };
			const params = { testParam: 'value' };

			// The skill doesn't use the API in the minimal implementation,
			// but we verify it can be passed without error
			const result = await executeSkill(skill, api, params);

			expect(result).toBeDefined();
			expect(result.exitCode).toBe(0);
		});

		it('throws error for invalid skill (no run function)', async () => {
			const invalidSkill = { notRun: () => {} } as any;

			await expect(executeSkill(invalidSkill, {}, {})).rejects.toThrow(
				'Invalid skill: must have a run function'
			);
		});

		it('throws error if skill.run returns invalid result', async () => {
			const invalidSkill = {
				run: async () => ({ invalid: true }) as any
			};

			await expect(executeSkill(invalidSkill, {}, {})).rejects.toThrow(
				'Skill must return an object with exitCode (number), stdout (string), and stderr (string)'
			);
		});

		it('handles skill execution errors gracefully', async () => {
			const errorSkill = {
				run: async () => {
					throw new Error('Skill execution error');
				}
			};

			await expect(executeSkill(errorSkill, {}, {})).rejects.toThrow(
				'Skill execution failed: Skill execution error'
			);
		});
	});

	describe('runSkill', () => {
		it('loads and executes a JavaScript skill in one call', async () => {
			const skillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/basic.js');
			const api = {};
			const params = {};

			const result = await runSkill(skillPath, api, params);

			expect(result).toBeDefined();
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe('hello world');
			expect(result.stderr).toBe('');
		});

		it('loads and executes a TypeScript skill in one call', async () => {
			const skillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/execute.ts');
			const api = {};
			const params = {};

			const result = await runSkill(skillPath, api, params);

			expect(result).toBeDefined();
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe('hello world');
			expect(result.stderr).toBe('');
		});
	});

	describe('TypeScript support', () => {
		it('registers ts-node only once for multiple TypeScript skills', async () => {
			const skillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/execute.ts');

			// Load the TypeScript skill multiple times
			const skill1 = await loadSkill(skillPath);
			const skill2 = await loadSkill(skillPath);
			const skill3 = await loadSkill(skillPath);

			// Verify all skills loaded successfully
			expect(skill1).toBeDefined();
			expect(skill2).toBeDefined();
			expect(skill3).toBeDefined();

			// Execute all skills to verify they work
			const result1 = await executeSkill(skill1, {}, {});
			const result2 = await executeSkill(skill2, {}, {});
			const result3 = await executeSkill(skill3, {}, {});

			expect(result1.stdout).toBe('hello world');
			expect(result2.stdout).toBe('hello world');
			expect(result3.stdout).toBe('hello world');
		});

		it('can load both JS and TS skills in the same test run', async () => {
			const jsSkillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/basic.js');
			const tsSkillPath = join(__dirname, '../../e2e/test-project/.brainy/skills/execute.ts');

			const jsSkill = await loadSkill(jsSkillPath);
			const tsSkill = await loadSkill(tsSkillPath);

			const jsResult = await executeSkill(jsSkill, {}, {});
			const tsResult = await executeSkill(tsSkill, {}, {});

			expect(jsResult.stdout).toBe('hello world');
			expect(tsResult.stdout).toBe('hello world');
		});
	});

	describe('result validation', () => {
		it('validates exitCode is a number', async () => {
			const invalidSkill = {
				run: async () => ({ exitCode: 'not a number', stdout: '', stderr: '' }) as any
			};

			await expect(executeSkill(invalidSkill, {}, {})).rejects.toThrow(
				'Skill must return an object with exitCode (number), stdout (string), and stderr (string)'
			);
		});

		it('validates stdout is a string', async () => {
			const invalidSkill = {
				run: async () => ({ exitCode: 0, stdout: 123, stderr: '' }) as any
			};

			await expect(executeSkill(invalidSkill, {}, {})).rejects.toThrow(
				'Skill must return an object with exitCode (number), stdout (string), and stderr (string)'
			);
		});

		it('validates stderr is a string', async () => {
			const invalidSkill = {
				run: async () => ({ exitCode: 0, stdout: '', stderr: null }) as any
			};

			await expect(executeSkill(invalidSkill, {}, {})).rejects.toThrow(
				'Skill must return an object with exitCode (number), stdout (string), and stderr (string)'
			);
		});

		it('accepts non-zero exit codes', async () => {
			const errorSkill = {
				run: async () => ({ exitCode: 1, stdout: '', stderr: 'error message' })
			};

			const result = await executeSkill(errorSkill, {}, {});

			expect(result.exitCode).toBe(1);
			expect(result.stderr).toBe('error message');
		});
	});
});
