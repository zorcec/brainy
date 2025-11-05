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
		it('should provide skill completions after @ at line start', () => {
			mockDocument = {
				lineAt: () => ({
					text: '@'
				})
			};

			const position = new vscode.Position(0, 1);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			expect(items!.some(item => item.label === 'context')).toBe(true);
			expect(items!.some(item => item.label === 'model')).toBe(true);
		});

		it('should provide skill completions after @ with partial text', () => {
			mockDocument = {
				lineAt: () => ({
					text: '@con'
				})
			};

			const position = new vscode.Position(0, 4);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
		});

		it('should not provide completions if @ is not at line start', () => {
			mockDocument = {
				lineAt: () => ({
					text: 'some text @'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeUndefined();
		});
	});

	describe('model completions', () => {
		it('should provide model completions after @model --id', () => {
			mockDocument = {
				lineAt: () => ({
					text: '@model --id '
				})
			};

			const position = new vscode.Position(0, 12);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			expect(items!.some(item => item.label === 'gpt-4')).toBe(true);
			expect(items!.some(item => item.label === 'claude-3')).toBe(true);
		});

		it('should provide model completions after @model --id with quote', () => {
			mockDocument = {
				lineAt: () => ({
					text: '@model --id "'
				})
			};

			const position = new vscode.Position(0, 13);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
		});

		it('should provide model completions with partial model name', () => {
			mockDocument = {
				lineAt: () => ({
					text: '@model --id "gpt'
				})
			};

			const position = new vscode.Position(0, 16);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
		});
	});

	describe('parameter completions', () => {
		it('should provide parameter completions after --', () => {
			mockDocument = {
				lineAt: () => ({
					text: '@context --'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
			expect(items!.some(item => item.label === 'name')).toBe(true);
			expect(items!.some(item => item.label === 'prompt')).toBe(true);
		});

		it('should provide parameter completions after -- with partial text', () => {
			mockDocument = {
				lineAt: () => ({
					text: '@task --pro'
				})
			};

			const position = new vscode.Position(0, 11);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeDefined();
			expect(items!.length).toBeGreaterThan(0);
		});
	});

	describe('no completions', () => {
		it('should return undefined for plain text', () => {
			mockDocument = {
				lineAt: () => ({
					text: 'some plain text'
				})
			};

			const position = new vscode.Position(0, 10);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeUndefined();
		});

		it('should return undefined for text after completed annotation', () => {
			mockDocument = {
				lineAt: () => ({
					text: '@model --id "gpt-4" '
				})
			};

			const position = new vscode.Position(0, 20);
			const items = provider.provideCompletionItems(mockDocument, position);

			expect(items).toBeUndefined();
		});
	});
});
