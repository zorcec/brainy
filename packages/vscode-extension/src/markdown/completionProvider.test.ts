/**
 * Module: markdown/completionProvider.test.ts
 *
 * Description:
 *   Unit tests for the Brainy completion provider.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrainyCompletionProvider } from './completionProvider';
import * as vscode from 'vscode';
import * as skillScanner from '../skills/skillScanner';
import * as skillParamsRegistry from '../skills/skillParamsRegistry';
import type { SkillParameter } from '../skills/types';

// Mock vscode
vi.mock('vscode', () => ({
	CompletionItemKind: {
		Function: 3,
		Value: 12,
		Field: 5
	},
	CompletionItem: class {
		label: string;
		kind: number;
		insertText?: string;
		detail?: string;
		documentation?: string;
		constructor(label: string, kind: number) {
			this.label = label;
			this.kind = kind;
		}
	},
	Position: class {
		line: number;
		character: number;
		constructor(line: number, character: number) {
			this.line = line;
			this.character = character;
		}
	},
	lm: {
		selectChatModels: vi.fn(async () => [
			{ id: 'gpt-4o', vendor: 'OpenAI' },
			{ id: 'claude-3', vendor: 'Anthropic' },
			{ id: 'gpt-4o-mini' }
		])
	}
}));

describe('BrainyCompletionProvider', () => {
	let provider: BrainyCompletionProvider;
	let mockDocument: any;

	beforeEach(() => {
		provider = new BrainyCompletionProvider();
		
		// Mock getAvailableSkills
		vi.spyOn(skillScanner, 'getAvailableSkills').mockReturnValue([
			'context',
			'model',
			'task',
			'execute'
		]);
	});

	describe('skill completions', () => {
		it('should provide skill completions after @ at line start', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@'
				})
			};

			const position = new vscode.Position(0, 1);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			expect(items!.some((item: any) => item.label === 'context')).toBe(true);
			expect(items!.some((item: any) => item.label === 'model')).toBe(true);
		});

		it('should provide skill completions after @ with partial text', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@con'
				})
			};

			const position = new vscode.Position(0, 4);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
		});

		it('should not provide completions if @ is not at line start', async () => {
			mockDocument = {
				lineAt: () => ({
					text: 'some text @'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeUndefined();
		});
	});

	describe('model completions', () => {
		it('should provide model completions after @model --id', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@model --id '
				})
			};

			const position = new vscode.Position(0, 12);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			expect(items!.some((item: any) => item.label === 'gpt-4o')).toBe(true);
			expect(items!.some((item: any) => item.label === 'claude-3')).toBe(true);
		});

		it('should provide model completions after @model --id with quote', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@model --id "'
				})
			};

			const position = new vscode.Position(0, 13);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
		});

		it('should provide model completions with partial model name', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@model --id "gpt'
				})
			};

			const position = new vscode.Position(0, 16);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
		});
	});

	describe('parameter completions', () => {
		it('should provide parameter completions after single dash', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@context -'
				})
			};

			const position = new vscode.Position(0, 10);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			expect(items!.some((item: any) => item.label === 'name')).toBe(true);
			expect(items!.some((item: any) => item.label === 'prompt')).toBe(true);
		});

		it('should provide parameter completions after --', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@context --'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			expect(items!.some((item: any) => item.label === 'name')).toBe(true);
			expect(items!.some((item: any) => item.label === 'prompt')).toBe(true);
		});

		it('should provide parameter completions after -- with partial text', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@task --pro'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
		});
	});

	describe('no completions', () => {
		it('should return undefined for plain text', async () => {
			mockDocument = {
				lineAt: () => ({
					text: 'some plain text'
				})
			};

			const position = new vscode.Position(0, 10);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeUndefined();
		});

		it('should return undefined for text after completed annotation', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@model --id "gpt-4" '
				})
			};

			const position = new vscode.Position(0, 20);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeUndefined();
		});
	});

	describe('skill-specific parameter filtering', () => {
		beforeEach(() => {
			// Mock getSkillParams to return skill-specific parameters
			vi.spyOn(skillParamsRegistry, 'getSkillParams').mockImplementation((skillName: string) => {
				const paramsMap: Record<string, SkillParameter[]> = {
					'task': [
						{ name: 'prompt', description: 'Task prompt', required: true },
						{ name: 'model', description: 'Model to use', required: false },
						{ name: 'variable', description: 'Variable to store result', required: false }
					],
					'file': [
						{ name: 'action', description: 'Action to perform', required: true },
						{ name: 'path', description: 'File path', required: true },
						{ name: 'content', description: 'File content', required: false }
					],
					'context': [
						{ name: 'name', description: 'Context name', required: false },
						{ name: 'names', description: 'Multiple context names', required: false }
					],
					'model': [
						{ name: 'id', description: 'Model ID', required: true }
					]
				};
				return paramsMap[skillName];
			});
		});

		it('should only show task-specific parameters for @task skill', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@task --'
				})
			};

			const position = new vscode.Position(0, 8);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBe(3);
			
			const paramNames = items!.map((item: any) => item.label);
			expect(paramNames).toContain('prompt');
			expect(paramNames).toContain('model');
			expect(paramNames).toContain('variable');
			
			// Should NOT contain file-specific params
			expect(paramNames).not.toContain('action');
			expect(paramNames).not.toContain('path');
			expect(paramNames).not.toContain('content');
		});

		it('should only show file-specific parameters for @file skill', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@file --'
				})
			};

			const position = new vscode.Position(0, 8);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBe(3);
			
			const paramNames = items!.map((item: any) => item.label);
			expect(paramNames).toContain('action');
			expect(paramNames).toContain('path');
			expect(paramNames).toContain('content');
			
			// Should NOT contain task-specific params
			expect(paramNames).not.toContain('prompt');
			expect(paramNames).not.toContain('variable');
		});

		it('should only show context-specific parameters for @context skill', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@context --'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBe(2);
			
			const paramNames = items!.map((item: any) => item.label);
			expect(paramNames).toContain('name');
			expect(paramNames).toContain('names');
			
			// Should NOT contain other params
			expect(paramNames).not.toContain('prompt');
			expect(paramNames).not.toContain('action');
		});

		it('should mark required parameters in detail text', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@file --'
				})
			};

			const position = new vscode.Position(0, 8);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			
			// Find action param (required)
			const actionItem = items!.find((item: any) => item.label === 'action');
			expect(actionItem).toBeDefined();
			expect(actionItem!.detail).toContain('required');
			
			// Find content param (optional)
			const contentItem = items!.find((item: any) => item.label === 'content');
			expect(contentItem).toBeDefined();
			expect(contentItem!.detail).not.toContain('required');
		});

		it('should fall back to common parameters for unknown skill', async () => {
			// Mock getSkillParams to return undefined for unknown skill
			vi.spyOn(skillParamsRegistry, 'getSkillParams').mockReturnValue(undefined);
			
			mockDocument = {
				lineAt: () => ({
					text: '@unknown --'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			
			// Should show common parameters
			const paramNames = items!.map((item: any) => item.label);
			expect(paramNames).toContain('prompt');
			expect(paramNames).toContain('name');
			expect(paramNames).toContain('action');
		});

		it('should fall back to common parameters for skill with no params defined', async () => {
			// Mock getSkillParams to return empty array
			vi.spyOn(skillParamsRegistry, 'getSkillParams').mockReturnValue([]);
			
			mockDocument = {
				lineAt: () => ({
					text: '@custom --'
				})
			};

			const position = new vscode.Position(0, 10);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			
			// Should show common parameters as fallback
			const paramNames = items!.map((item: any) => item.label);
			expect(paramNames).toContain('prompt');
			expect(paramNames).toContain('variable');
		});

		it('should work with partial parameter text', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@task --pro'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			
			// Should still filter by skill, not by partial text
			const paramNames = items!.map((item: any) => item.label);
			expect(paramNames).toContain('prompt');
			expect(paramNames).toContain('model');
			expect(paramNames).toContain('variable');
			expect(paramNames).not.toContain('action');
		});

		it('should provide completions after flag with value (generic test 1)', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@input --prompt "your name" --'
				})
			};

			const position = new vscode.Position(0, 30);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			// Should show completions for next parameter
		});

		it('should provide completions after flag with value (generic test 2)', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@task --prompt "do something" --'
				})
			};

			const position = new vscode.Position(0, 32);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			// Should show task-specific completions
			const paramNames = items!.map((item: vscode.CompletionItem) => item.label);
			expect(paramNames).toContain('model');
			expect(paramNames).toContain('variable');
		});

		it('should provide completions after multiple flags with values', async () => {
			mockDocument = {
				lineAt: () => ({
					text: '@file --action "read" --path "/tmp/test.txt" --'
				})
			};

			const position = new vscode.Position(0, 47);
			const items = await provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			// Should show file-specific completions
			const paramNames = items!.map((item: vscode.CompletionItem) => item.label);
			expect(paramNames).toContain('content');
		});
	});
});
