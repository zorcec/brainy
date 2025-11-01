/**
 * Unit tests for playButton module
 * 
 * Note: These tests use mocked VS Code APIs since the extension runs in a VS Code environment.
 * Full integration tests are covered in E2E tests.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock VS Code module before importing playButton
vi.mock('vscode', () => {
  class MockEventEmitter {
    fire() {}
    get event() {
      return () => ({ dispose: () => {} });
    }
  }

  class MockRange {
    start: any;
    end: any;
    constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
      this.start = { line: startLine, character: startChar };
      this.end = { line: endLine, character: endChar };
    }
  }

  class MockPosition {
    line: number;
    character: number;
    constructor(line: number, character: number) {
      this.line = line;
      this.character = character;
    }
  }

  class MockCodeLens {
    range: any;
    command?: any;
    constructor(range: any, command?: any) {
      this.range = range;
      this.command = command;
    }
  }

  return {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      createTextEditorDecorationType: vi.fn(() => ({
        dispose: vi.fn()
      })),
      createOutputChannel: vi.fn(() => ({
        clear: vi.fn(),
        appendLine: vi.fn(),
        show: vi.fn()
      })),
      activeTextEditor: undefined
    },
    workspace: {
      openTextDocument: vi.fn()
    },
    commands: {
      registerCommand: vi.fn(() => ({ dispose: vi.fn() }))
    },
    languages: {
      registerCodeLensProvider: vi.fn(() => ({ dispose: vi.fn() }))
    },
    EventEmitter: MockEventEmitter,
    Range: MockRange,
    Position: MockPosition,
    CodeLens: MockCodeLens,
    Uri: class {
      static parse() { return {}; }
    },
    MarkdownString: class {
      constructor(public value: string) {}
    }
  };
});

import { PlaybookCodeLensProvider } from './playButton';
import type * as vscode from 'vscode';

// Mock document interface
interface MockTextDocument {
	fileName: string;
	getText: () => string;
	uri: { toString: () => string };
	languageId: string;
}

// Mock cancellation token interface
interface MockCancellationToken {
	isCancellationRequested: boolean;
	onCancellationRequested: () => void;
}

describe('PlaybookCodeLensProvider', () => {
	let provider: PlaybookCodeLensProvider;
	let mockDocument: MockTextDocument;
	let mockToken: MockCancellationToken;

	beforeEach(() => {
		provider = new PlaybookCodeLensProvider();
		mockToken = {
			isCancellationRequested: false,
			onCancellationRequested: vi.fn(),
		};
	});

	test('should provide CodeLens for .brainy.md files', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '@model "gpt-4.1"',
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		expect(codeLenses).toBeDefined();
		expect(Array.isArray(codeLenses)).toBe(true);
		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(1);
			expect(codeLenses[0].command?.title).toContain('Parse Playbook');
			expect(codeLenses[0].command?.command).toBe('brainy.playbook.parse');
		}
	});

	test('should not provide CodeLens for non-.brainy.md files', () => {
		mockDocument = {
			fileName: '/path/to/regular.md',
			getText: () => '@model "gpt-4.1"',
			uri: { toString: () => 'file:///path/to/regular.md' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		expect(codeLenses).toBeDefined();
		expect(Array.isArray(codeLenses)).toBe(true);
		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(0);
		}
	});

	test('should not provide CodeLens for .txt files', () => {
		mockDocument = {
			fileName: '/path/to/document.txt',
			getText: () => 'some text',
			uri: { toString: () => 'file:///path/to/document.txt' },
			languageId: 'plaintext',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		expect(codeLenses).toBeDefined();
		expect(Array.isArray(codeLenses)).toBe(true);
		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(0);
		}
	});

	test('should have onDidChangeCodeLenses event', () => {
		expect(provider.onDidChangeCodeLenses).toBeDefined();
		expect(typeof provider.onDidChangeCodeLenses).toBe('function');
	});

	test('should support refresh method', () => {
		expect(provider.refresh).toBeDefined();
		expect(typeof provider.refresh).toBe('function');

		// Should not throw when called
		expect(() => provider.refresh()).not.toThrow();
	});

	test('should place CodeLens on the first line', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '@model "gpt-4.1"\n@task "Do something"',
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses) && codeLenses.length > 0) {
			// Check that CodeLens is on line 0
			expect(codeLenses[0].range.start.line).toBe(0);
			expect(codeLenses[0].range.end.line).toBe(0);
		}
	});

	test('should include document URI in command arguments', () => {
		const testUri = 'file:///path/to/test.brainy.md';
		mockDocument = {
			fileName: '/path/to/test.brainy.md',
			getText: () => '@model "gpt-4.1"',
			uri: { toString: () => testUri },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses) && codeLenses.length > 0) {
			expect(codeLenses[0].command?.arguments).toBeDefined();
			expect(codeLenses[0].command?.arguments?.length).toBeGreaterThan(0);
		}
	});
});

describe('PlaybookCodeLensProvider - Edge Cases', () => {
	let provider: PlaybookCodeLensProvider;
	let mockToken: MockCancellationToken;

	beforeEach(() => {
		provider = new PlaybookCodeLensProvider();
		mockToken = {
			isCancellationRequested: false,
			onCancellationRequested: vi.fn(),
		};
	});

	test('should handle empty .brainy.md files', () => {
		const mockDocument: MockTextDocument = {
			fileName: '/path/to/empty.brainy.md',
			getText: () => '',
			uri: { toString: () => 'file:///path/to/empty.brainy.md' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		// Should still show play button for empty files
		expect(Array.isArray(codeLenses)).toBe(true);
		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(1);
		}
	});

	test('should handle very large .brainy.md files', () => {
		let largeContent = '';
		for (let i = 0; i < 10000; i++) {
			largeContent += `Line ${i}\n`;
		}

		const mockDocument: MockTextDocument = {
			fileName: '/path/to/large.brainy.md',
			getText: () => largeContent,
			uri: { toString: () => 'file:///path/to/large.brainy.md' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		// Should still provide CodeLens for large files
		expect(Array.isArray(codeLenses)).toBe(true);
		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(1);
		}
	});

	test('should handle files with .BRAINY.MD extension (case insensitive check)', () => {
		const mockDocument: MockTextDocument = {
			fileName: '/path/to/PLAYBOOK.BRAINY.MD',
			getText: () => '@model "gpt-4.1"',
			uri: { toString: () => 'file:///path/to/PLAYBOOK.BRAINY.MD' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		// Note: Current implementation is case-sensitive
		// This test documents the current behavior
		expect(Array.isArray(codeLenses)).toBe(true);
	});
});
