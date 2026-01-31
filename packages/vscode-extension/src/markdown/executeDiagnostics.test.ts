/**
 * Unit tests for execute diagnostics provider
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { validateExecuteAnnotations } from './executeDiagnostics';
import * as parser from '../parser';

// Mock the parser
vi.mock('../parser', () => ({
	parseAnnotations: vi.fn((text: string) => {
		// Simple mock that returns execute blocks based on text content
		const blocks: any[] = [];
		const lines = text.split('\n');
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (line === '@execute') {
				blocks.push({ name: 'execute', line: i + 1, content: line });
			} else if (line.startsWith('```')) {
				const lang = line.slice(3);
				blocks.push({ 
					name: 'plainCodeBlock', 
					line: i + 1, 
					content: 'code', 
					metadata: lang ? { language: lang } : {} 
				});
			} else if (line && line !== '```' && !line.startsWith('@')) {
				blocks.push({ name: 'plainText', line: i + 1, content: line });
			}
		}
		
		return { blocks, errors: [] };
	})
}));

// Mock vscode module
vi.mock('vscode', () => ({
	DiagnosticSeverity: {
		Error: 0,
		Warning: 1,
		Information: 2,
		Hint: 3
	},
	Range: class Range {
		constructor(
			public startLine: number,
			public startChar: number,
			public endLine: number,
			public endChar: number
		) {}
	},
	Diagnostic: class Diagnostic {
		constructor(
			public range: any,
			public message: string,
			public severity: number
		) {}
		source?: string;
		code?: string;
	},
	languages: {
		createDiagnosticCollection: vi.fn(() => ({
			set: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
			dispose: vi.fn()
		}))
	},
	workspace: {
		textDocuments: [],
		onDidOpenTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
		onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
		onDidCloseTextDocument: vi.fn(() => ({ dispose: vi.fn() }))
	}
}));

describe('executeDiagnostics', () => {
	let mockDiagnosticCollection: any;
	let mockDocument: any;

	beforeEach(() => {
		mockDiagnosticCollection = {
			set: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
			dispose: vi.fn()
		};

		mockDocument = {
			fileName: 'test.brainy.md',
			uri: { fsPath: 'test.brainy.md' },
			lineCount: 10,
			lineAt: vi.fn((line: number) => ({
				text: '@execute',
				range: { start: { line, character: 0 }, end: { line, character: 8 } }
			})),
			getText: vi.fn()
		};
	});

	it('should create diagnostic when @execute has no following block', () => {
		mockDocument.getText = vi.fn(() => '@execute\n');

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		expect(mockDiagnosticCollection.set).toHaveBeenCalled();
		const diagnostics = mockDiagnosticCollection.set.mock.calls[0][1];
		expect(diagnostics.length).toBeGreaterThan(0);
		expect(diagnostics[0].message).toContain('No code block found');
	});

	it('should create diagnostic when @execute is followed by non-code block', () => {
		mockDocument.getText = vi.fn(() => '@execute\nSome text\n');

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		expect(mockDiagnosticCollection.set).toHaveBeenCalled();
		const diagnostics = mockDiagnosticCollection.set.mock.calls[0][1];
		expect(diagnostics.length).toBeGreaterThan(0);
		expect(diagnostics[0].message).toContain('Expected code block');
	});

	it('should create diagnostic when code block has no language', () => {
		mockDocument.getText = vi.fn(() => '@execute\n```\necho "test"\n```\n');

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		expect(mockDiagnosticCollection.set).toHaveBeenCalled();
		const diagnostics = mockDiagnosticCollection.set.mock.calls[0][1];
		expect(diagnostics.length).toBeGreaterThan(0);
		expect(diagnostics[0].message).toContain('missing language identifier');
	});

	it('should not create diagnostic when @execute is correctly followed by code block', () => {
		mockDocument.getText = vi.fn(() => '@execute\n```bash\necho "test"\n```\n');

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		expect(mockDiagnosticCollection.set).toHaveBeenCalled();
		const diagnostics = mockDiagnosticCollection.set.mock.calls[0][1];
		expect(diagnostics.length).toBe(0);
	});

	it('should not validate non-.brainy.md files', () => {
		mockDocument.fileName = 'regular.md';
		mockDocument.getText = vi.fn(() => '@execute\n');

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		expect(mockDiagnosticCollection.delete).toHaveBeenCalledWith(mockDocument.uri);
	});

	it('should handle multiple @execute blocks', () => {
		mockDocument.getText = vi.fn(() => 
			'@execute\n```bash\necho "1"\n```\n\n@execute\nSome text\n'
		);

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		expect(mockDiagnosticCollection.set).toHaveBeenCalled();
		const diagnostics = mockDiagnosticCollection.set.mock.calls[0][1];
		// Should only have diagnostic for the second @execute
		expect(diagnostics.length).toBe(1);
		expect(diagnostics[0].message).toContain('Expected code block');
	});

	it('should handle parsing errors gracefully', () => {
		// Make parseAnnotations throw an error
		vi.mocked(parser.parseAnnotations).mockImplementationOnce(() => {
			throw new Error('Parse error');
		});
		
		mockDocument.getText = vi.fn(() => '@execute\n');

		// Should not throw - errors should be caught and handled
		expect(() => {
			validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);
		}).not.toThrow();
		
		// Should still call set (with empty diagnostics)
		expect(mockDiagnosticCollection.set).toHaveBeenCalled();
	});

	it('should set diagnostic source to brainy', () => {
		mockDocument.getText = vi.fn(() => '@execute\n');

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		const diagnostics = mockDiagnosticCollection.set.mock.calls[0][1];
		expect(diagnostics[0].source).toBe('brainy');
	});

	it('should set diagnostic code', () => {
		mockDocument.getText = vi.fn(() => '@execute\n');

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		const diagnostics = mockDiagnosticCollection.set.mock.calls[0][1];
		expect(diagnostics[0].code).toBe('execute-missing-code-block');
	});

	it('should set error severity', () => {
		mockDocument.getText = vi.fn(() => '@execute\n');

		validateExecuteAnnotations(mockDocument, mockDiagnosticCollection);

		const diagnostics = mockDiagnosticCollection.set.mock.calls[0][1];
		expect(diagnostics[0].severity).toBe(0); // DiagnosticSeverity.Error
	});
});
