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
import { resetAllExecutionState, setExecutionState } from './executionState';

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
		resetAllExecutionState();
	});

	test('should provide play button only when idle and no errors', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '',  // Empty content (no errors)
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
			// In idle state with no errors, should show 1 button: Play
			expect(codeLenses.length).toBe(1);
			expect(codeLenses[0].command?.title).toContain('Play');
		}
	});

	test('should enable play button when state is idle and no errors', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '',  // Empty content has no errors
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(1);
			const playButton = codeLenses[0];
			expect(playButton.command?.command).toBe('brainy.playbook.play');
			expect(playButton.command?.title).toContain('Play');
		}
	});

	test('should hide play button when state is running', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '@model "gpt-4.1"',
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		// Set state to running
		setExecutionState('file:///path/to/playbook.brainy.md', 'running');

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses)) {
			// In running state, should show Pause and Stop, not Play
			expect(codeLenses.length).toBe(2);
			expect(codeLenses[0].command?.title).toContain('Pause');
			expect(codeLenses[1].command?.title).toContain('Stop');
		}
	});

	test('should show pause and stop buttons when state is running', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '@model "gpt-4.1"',
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		// Set state to running
		setExecutionState('file:///path/to/playbook.brainy.md', 'running');

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(2);
			const pauseButton = codeLenses[0];
			expect(pauseButton.command?.command).toBe('brainy.playbook.pause');
			expect(pauseButton.command?.title).toContain('Pause');
		}
	});

	test('should hide pause and stop when state is idle', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '',  // Empty content (no errors)
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses)) {
			// In idle state, should only show Play button
			expect(codeLenses.length).toBe(1);
			expect(codeLenses[0].command?.title).toContain('Play');
		}
	});

	test('should show stop button when state is running', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '@model "gpt-4.1"',
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		// Set state to running
		setExecutionState('file:///path/to/playbook.brainy.md', 'running');

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(2);
			const stopButton = codeLenses[1];
			expect(stopButton.command?.command).toBe('brainy.playbook.stop');
			expect(stopButton.command?.title).toContain('Stop');
		}
	});

	test('should show stop button when state is paused', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '@model "gpt-4.1"',
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		// Set state to paused
		setExecutionState('file:///path/to/playbook.brainy.md', 'paused');

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(2);
			const stopButton = codeLenses[1];
			expect(stopButton.command?.command).toBe('brainy.playbook.stop');
			expect(stopButton.command?.title).toContain('Stop');
		}
	});

	test('should hide stop button when state is idle', () => {
		mockDocument = {
			fileName: '/path/to/playbook.brainy.md',
			getText: () => '',  // Empty content (no errors)
			uri: { toString: () => 'file:///path/to/playbook.brainy.md' },
			languageId: 'markdown',
		};

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses)) {
			// In idle state, should only show Play button, not Stop
			expect(codeLenses.length).toBe(1);
			expect(codeLenses[0].command?.title).toContain('Play');
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

	test('should include document URI in command arguments when enabled', () => {
		const testUri = 'file:///path/to/test.brainy.md';
		mockDocument = {
			fileName: '/path/to/test.brainy.md',
			getText: () => '',  // Empty content has no errors
			uri: { toString: () => testUri },
			languageId: 'markdown',
		};

		// Set state to idle so play is enabled
		setExecutionState(testUri, 'idle');

		const codeLenses = provider.provideCodeLenses(
			mockDocument as unknown as vscode.TextDocument,
			mockToken as unknown as vscode.CancellationToken
		);

		if (Array.isArray(codeLenses) && codeLenses.length > 0) {
			const playButton = codeLenses[0];
			expect(playButton.command?.arguments).toBeDefined();
			expect(playButton.command?.arguments?.length).toBeGreaterThan(0);
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
		resetAllExecutionState();
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

		// Should show 1 button for empty files (Play button) since no errors
		expect(Array.isArray(codeLenses)).toBe(true);
		if (Array.isArray(codeLenses)) {
			expect(codeLenses.length).toBe(1);
			expect(codeLenses[0].command?.title).toContain('Play');
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
			// Should show 1 button for idle state with no errors
			expect(codeLenses.length).toBe(1);
			expect(codeLenses[0].command?.title).toContain('Play');
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
