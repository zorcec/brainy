/**
 * Tests for skills/skillScanner.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Mock vscode module before imports
vi.mock('vscode', () => ({
	workspace: {
		createFileSystemWatcher: vi.fn()
	},
	FileSystemWatcher: vi.fn(),
	RelativePattern: vi.fn()
}));

import {
	getAvailableSkills,
	refreshSkills,
	isSkillAvailable,
	scanLocalSkills,
	getLocalSkills,
	isLocalSkill,
	resetSkillScanner
} from './skillScanner';

describe('skillScanner', () => {
	let tempDir: string;

	beforeEach(() => {
		resetSkillScanner();
		// Create a temporary directory for testing
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainy-skills-test-'));
	});

	afterEach(() => {
		resetSkillScanner();
		// Clean up temp directory
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	describe('refreshSkills', () => {
		it('includes built-in skills when no workspace provided', () => {
			const skills = refreshSkills();
			expect(skills).toContain('execute');
			expect(skills).toContain('file');
			expect(skills).toContain('task');
		});

		it('includes built-in skills with workspace provided', () => {
			const skills = refreshSkills(tempDir);
			expect(skills).toContain('execute');
			expect(skills).toContain('file');
		});

		it('includes local skills when .skills/ folder exists', () => {
			// Create .skills/ folder with a test skill
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			fs.writeFileSync(path.join(skillsDir, 'custom-skill.ts'), 'export const skill = {};');

			const skills = refreshSkills(tempDir);
			expect(skills).toContain('execute'); // built-in
			expect(skills).toContain('custom-skill'); // local
		});

		it('handles missing .skills/ folder gracefully', () => {
			const skills = refreshSkills(tempDir);
			expect(skills.length).toBeGreaterThan(0); // still has built-in skills
			expect(skills).not.toContain('custom-skill');
		});
	});

	describe('scanLocalSkills', () => {
		it('returns empty array when .skills/ folder does not exist', () => {
			const localSkills = scanLocalSkills(tempDir);
			expect(localSkills).toEqual([]);
		});

		it('finds .ts files in .skills/ folder', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			fs.writeFileSync(path.join(skillsDir, 'skill1.ts'), 'export const skill = {};');
			fs.writeFileSync(path.join(skillsDir, 'skill2.ts'), 'export const skill = {};');

			const localSkills = scanLocalSkills(tempDir);
			expect(localSkills).toContain('skill1');
			expect(localSkills).toContain('skill2');
			expect(localSkills).toHaveLength(2);
		});

		it('ignores non-.ts files', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			fs.writeFileSync(path.join(skillsDir, 'skill1.ts'), 'export const skill = {};');
			fs.writeFileSync(path.join(skillsDir, 'readme.md'), '# README');
			fs.writeFileSync(path.join(skillsDir, 'skill2.js'), 'module.exports = {};');

			const localSkills = scanLocalSkills(tempDir);
			expect(localSkills).toContain('skill1');
			expect(localSkills).not.toContain('readme');
			expect(localSkills).not.toContain('skill2');
			expect(localSkills).toHaveLength(1);
		});
	});

	describe('getAvailableSkills', () => {
		it('returns copy of available skills array', () => {
			refreshSkills();
			const skills1 = getAvailableSkills();
			const skills2 = getAvailableSkills();
			expect(skills1).toEqual(skills2);
			expect(skills1).not.toBe(skills2); // different array instances
		});
	});

	describe('isSkillAvailable', () => {
		it('returns true for built-in skills', () => {
			refreshSkills();
			expect(isSkillAvailable('execute')).toBe(true);
			expect(isSkillAvailable('file')).toBe(true);
		});

		it('returns false for non-existent skills', () => {
			refreshSkills();
			expect(isSkillAvailable('nonexistent')).toBe(false);
		});

		it('returns true for local skills', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			fs.writeFileSync(path.join(skillsDir, 'custom.ts'), 'export const skill = {};');

			refreshSkills(tempDir);
			expect(isSkillAvailable('custom')).toBe(true);
		});

		it('is case-sensitive', () => {
			refreshSkills();
			expect(isSkillAvailable('Execute')).toBe(false);
			expect(isSkillAvailable('execute')).toBe(true);
		});
	});

	describe('getLocalSkills', () => {
		it('returns empty array when no local skills', () => {
			refreshSkills(tempDir);
			expect(getLocalSkills()).toEqual([]);
		});

		it('returns only local skills', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			fs.writeFileSync(path.join(skillsDir, 'custom.ts'), 'export const skill = {};');

			refreshSkills(tempDir);
			const localSkills = getLocalSkills();
			expect(localSkills).toContain('custom');
			expect(localSkills).not.toContain('execute'); // built-in
		});
	});

	describe('isLocalSkill', () => {
		it('returns false for built-in skills', () => {
			refreshSkills();
			expect(isLocalSkill('execute')).toBe(false);
		});

		it('returns true for local skills', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			fs.writeFileSync(path.join(skillsDir, 'custom.ts'), 'export const skill = {};');

			refreshSkills(tempDir);
			expect(isLocalSkill('custom')).toBe(true);
		});

		it('returns false for non-existent skills', () => {
			refreshSkills();
			expect(isLocalSkill('nonexistent')).toBe(false);
		});
	});

	describe('resetSkillScanner', () => {
		it('clears all state', () => {
			const skillsDir = path.join(tempDir, '.skills');
			fs.mkdirSync(skillsDir);
			fs.writeFileSync(path.join(skillsDir, 'custom.ts'), 'export const skill = {};');

			refreshSkills(tempDir);
			expect(getAvailableSkills().length).toBeGreaterThan(0);

			resetSkillScanner();
			expect(getAvailableSkills()).toEqual([]);
			expect(getLocalSkills()).toEqual([]);
		});
	});
});
