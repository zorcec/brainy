/**
 * Module: skills/skillLoader.test.ts
 *
 * Description:
 *   Unit tests for the skill loader.
 *   Tests loading and execution of built-in and local skills in-process.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadSkill, executeSkill, resetSkillLoader, validateLocalSkill } from './skillLoader';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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
		createFileSystemWatcher: vi.fn()
	},
	Uri: {
		file: (path: string) => ({ fsPath: path, path }),
	},
	FileSystemWatcher: vi.fn(),
	RelativePattern: vi.fn()
}));

// Mock skillScanner
vi.mock('./skillScanner', () => ({
	isLocalSkill: vi.fn((name: string) => name.startsWith('local-')),
	isSkillAvailable: vi.fn(() => true),
	refreshSkills: vi.fn(),
	getAvailableSkills: vi.fn(() => ['execute', 'file']),
	resetSkillScanner: vi.fn()
}));

describe('skillLoader', () => {
	let tempDir: string;

	beforeEach(() => {
		resetSkillLoader();
		// Create a temporary directory for testing
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainy-loader-test-'));
	});

	afterEach(() => {
		resetSkillLoader();
		// Clean up temp directory
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
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

	describe('loadSkill - local skills', () => {
		it('should load valid local skill', async () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			
			const skillCode = `
				export const localTestSkill = {
					name: 'local-test',
					description: 'Test local skill',
					async execute(api, params) {
						return { messages: [{ role: 'assistant', content: 'Hello from local skill' }] };
					}
				};
			`;
			fs.writeFileSync(path.join(skillsDir, 'local-test.ts'), skillCode);
			
			const skill = await loadSkill('local-test', tempDir);
			expect(skill).toBeDefined();
			expect(skill.execute).toBeDefined();
		});

		it('should throw error for non-existent local skill file', async () => {
			await expect(loadSkill('local-nonexistent', tempDir)).rejects.toThrow('Skill file not found');
		});

		it('should throw error for invalid local skill (no execute)', async () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			
			const skillCode = `
				export const invalidSkill = {
					name: 'local-invalid',
					description: 'Invalid skill'
				};
			`;
			fs.writeFileSync(path.join(skillsDir, 'local-invalid.ts'), skillCode);
			
			await expect(loadSkill('local-invalid', tempDir)).rejects.toThrow('must export an object with an execute function');
		});
	});

	describe('validateLocalSkill', () => {
		it('should validate valid local skill', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			
			const skillCode = `
				export const validSkill = {
					name: 'local-valid',
					description: 'Valid skill',
					async execute(api, params) {
						return { messages: [] };
					}
				};
			`;
			fs.writeFileSync(path.join(skillsDir, 'local-valid.ts'), skillCode);
			
			const result = validateLocalSkill('local-valid', tempDir);
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should return error for invalid local skill', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			
			const skillCode = `
				export const invalidSkill = {
					name: 'local-invalid'
				};
			`;
			fs.writeFileSync(path.join(skillsDir, 'local-invalid.ts'), skillCode);
			
			const result = validateLocalSkill('local-invalid', tempDir);
			expect(result.valid).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should return error for non-existent skill file', () => {
			const result = validateLocalSkill('local-nonexistent', tempDir);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('not found');
		});

		it('should return error with stack trace for syntax errors', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			
			const skillCode = `
				export const skill = {
					execute: () => { throw new Error('Test error'); }
				};
				skill.execute();
			`;
			fs.writeFileSync(path.join(skillsDir, 'local-error.ts'), skillCode);
			
			const result = validateLocalSkill('local-error', tempDir);
			expect(result.valid).toBe(false);
			expect(result.error).toBeDefined();
		});
	});
});

