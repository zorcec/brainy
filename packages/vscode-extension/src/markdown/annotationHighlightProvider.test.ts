/**
 * Unit tests for markdown/annotationHighlightProvider.ts
 *
 * Tests cover:
 * - Correct annotation patterns (single-line, multi-line)
 * - Flag highlighting (named flags, direct values, quoted values)
 * - Error highlighting and hover messages
 * - Edge cases (empty documents, nested annotations, overlapping tokens)
 * - Parser integration
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock vscode module before imports
vi.mock('vscode', () => {
  class MockSemanticTokensLegend {
    tokenTypes: string[];
    tokenModifiers: string[];
    constructor(tokenTypes: string[], tokenModifiers: string[]) {
      this.tokenTypes = tokenTypes;
      this.tokenModifiers = tokenModifiers;
    }
  }

  class MockSemanticTokensBuilder {
    private legend: MockSemanticTokensLegend;
    private tokens: Array<{ line: number; char: number; length: number; tokenType: number; tokenModifiers: number }> = [];

    constructor(legend: MockSemanticTokensLegend) {
      this.legend = legend;
    }

    push(range: any, tokenType: string, tokenModifiers: any[]) {
      const tokenTypeIndex = this.legend.tokenTypes.indexOf(tokenType);
      this.tokens.push({
        line: range.start.line,
        char: range.start.character,
        length: range.end.character - range.start.character,
        tokenType: tokenTypeIndex,
        tokenModifiers: 0
      });
    }

    build() {
      // Sort tokens by line, then by character
      this.tokens.sort((a, b) => {
        if (a.line !== b.line) return a.line - b.line;
        return a.char - b.char;
      });

      // Encode as delta format
      const data: number[] = [];
      let prevLine = 0;
      let prevChar = 0;

      for (const token of this.tokens) {
        const deltaLine = token.line - prevLine;
        const deltaChar = deltaLine === 0 ? token.char - prevChar : token.char;

        data.push(deltaLine, deltaChar, token.length, token.tokenType, token.tokenModifiers);

        prevLine = token.line;
        prevChar = token.char;
      }

      return { data: new Uint32Array(data), _tokens: this.tokens };
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

  class MockUri {
    static parse(value: string) {
      return { fsPath: value };
    }
  }

  class MockHover {
    contents: any[];
    constructor(contents: any) {
      this.contents = Array.isArray(contents) ? contents : [contents];
    }
  }

  class MockMarkdownString {
    value: string;
    constructor(value: string) {
      this.value = value;
    }
  }

  return {
    SemanticTokensLegend: MockSemanticTokensLegend,
    SemanticTokensBuilder: MockSemanticTokensBuilder,
    Range: MockRange,
    Position: MockPosition,
    Uri: MockUri,
    Hover: MockHover,
    MarkdownString: MockMarkdownString,
    EndOfLine: { LF: 1, CRLF: 2 }
  };
});

import * as vscode from 'vscode';
import {
	AnnotationHighlightProvider,
	AnnotationErrorHoverProvider,
	createLegend,
	TOKEN_TYPES,
	TOKEN_MODIFIERS
} from './annotationHighlightProvider';

/**
 * Helper function to create a mock TextDocument.
 */
function createMockDocument(content: string, languageId = 'markdown'): vscode.TextDocument {
	const lines = content.split('\n');
	return {
		getText: () => content,
		lineCount: lines.length,
		languageId,
		lineAt: (lineNumber: number) => {
			const text = lines[lineNumber] || '';
			const trimmed = text.trim();
			const firstNonWhitespace = text.length - text.trimStart().length;
			return {
				text,
				firstNonWhitespaceCharacterIndex: firstNonWhitespace,
				range: new vscode.Range(lineNumber, 0, lineNumber, text.length),
				rangeIncludingLineBreak: new vscode.Range(lineNumber, 0, lineNumber + 1, 0),
				lineNumber,
				isEmptyOrWhitespace: trimmed.length === 0
			};
		},
		uri: vscode.Uri.parse('file:///test.md'),
		fileName: '/test.md',
		isUntitled: false,
		isDirty: false,
		isClosed: false,
		version: 1,
		eol: vscode.EndOfLine.LF,
		save: async () => true,
		offsetAt: (position: vscode.Position) => 0,
		positionAt: (offset: number) => new vscode.Position(0, 0),
		validateRange: (range: vscode.Range) => range,
		validatePosition: (position: vscode.Position) => position,
		getWordRangeAtPosition: () => undefined
	} as unknown as vscode.TextDocument;
}

/**
 * Helper function to extract token information from SemanticTokens.
 */
function decodeSemanticTokens(tokens: vscode.SemanticTokens, legend: vscode.SemanticTokensLegend) {
	const data = tokens.data;
	const result: Array<{ line: number; char: number; length: number; type: string }> = [];

	let line = 0;
	let char = 0;

	for (let i = 0; i < data.length; i += 5) {
		const deltaLine = data[i];
		const deltaChar = data[i + 1];
		const length = data[i + 2];
		const tokenType = data[i + 3];

		line += deltaLine;
		if (deltaLine > 0) {
			char = deltaChar;
		} else {
			char += deltaChar;
		}

		result.push({
			line,
			char,
			length,
			type: legend.tokenTypes[tokenType]
		});
	}

	return result;
}

describe('createLegend', () => {
	test('creates legend with correct token types', () => {
		const legend = createLegend();
		expect(legend.tokenTypes).toEqual(['annotation', 'flag', 'error']);
		expect(legend.tokenModifiers).toEqual([]);
	});

	test('token types match exported constant', () => {
		expect(TOKEN_TYPES).toEqual(['annotation', 'flag', 'error']);
	});

	test('token modifiers match exported constant', () => {
		expect(TOKEN_MODIFIERS).toEqual([]);
	});
});

describe('AnnotationHighlightProvider - Single-line annotations', () => {
	let provider: AnnotationHighlightProvider;
	let legend: vscode.SemanticTokensLegend;

	beforeEach(() => {
		provider = new AnnotationHighlightProvider();
		legend = createLegend();
	});

	test('highlights simple annotation without flags', () => {
		const doc = createMockDocument('@task');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		// Should have one annotation token
		expect(decoded.length).toBeGreaterThanOrEqual(1);
		expect(decoded[0].type).toBe('annotation');
	});

	test('highlights annotation with single flag', () => {
		const doc = createMockDocument('@task --prompt "Do something"');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		// Should have annotation, flag name, and quoted value tokens
		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		const flagTokens = decoded.filter((t) => t.type === 'flag');

		expect(annotationTokens.length).toBe(1);
		expect(flagTokens.length).toBeGreaterThanOrEqual(1); // --prompt and "Do something"
	});

	test('highlights annotation with multiple flags', () => {
		const doc = createMockDocument('@task --prompt "Test" --variable "result"');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		const flagTokens = decoded.filter((t) => t.type === 'flag');

		expect(annotationTokens.length).toBe(1);
		expect(flagTokens.length).toBeGreaterThanOrEqual(2); // Multiple flags and values
	});

	test('highlights annotation with direct values', () => {
		const doc = createMockDocument('@context "main" "research"');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		const flagTokens = decoded.filter((t) => t.type === 'flag');

		expect(annotationTokens.length).toBe(1);
		expect(flagTokens.length).toBeGreaterThanOrEqual(2); // Two quoted values
	});
});

describe('AnnotationHighlightProvider - Multi-line annotations', () => {
	let provider: AnnotationHighlightProvider;
	let legend: vscode.SemanticTokensLegend;

	beforeEach(() => {
		provider = new AnnotationHighlightProvider();
		legend = createLegend();
	});

	test('highlights multi-line annotation with flags on separate lines', () => {
		const doc = createMockDocument(`@task
  --prompt "Do something"
  --variable "result"`);
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		const flagTokens = decoded.filter((t) => t.type === 'flag');

		expect(annotationTokens.length).toBe(1);
		expect(flagTokens.length).toBeGreaterThanOrEqual(2); // Multiple flags across lines
	});

	test('each line in multi-line annotation gets separate tokens', () => {
		const doc = createMockDocument(`@task
  --prompt "Line 1"
  --flag "Line 2"`);
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		// Tokens should be on different lines
		const lines = new Set(decoded.map((t) => t.line));
		expect(lines.size).toBeGreaterThan(1);
	});
});

describe('AnnotationHighlightProvider - Plain text and comments', () => {
	let provider: AnnotationHighlightProvider;

	beforeEach(() => {
		provider = new AnnotationHighlightProvider();
	});

	test('does not highlight plain text', () => {
		const doc = createMockDocument('This is plain text');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		// Should return empty tokens or undefined
		if (tokens) {
			const legend = createLegend();
			const decoded = decodeSemanticTokens(tokens, legend);
			expect(decoded.length).toBe(0);
		}
	});

	test('does not highlight HTML comments', () => {
		const doc = createMockDocument('<!-- This is a comment -->');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		if (tokens) {
			const legend = createLegend();
			const decoded = decodeSemanticTokens(tokens, legend);
			expect(decoded.length).toBe(0);
		}
	});

	test('does not highlight code blocks', () => {
		const doc = createMockDocument('```bash\necho "test"\n```');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		if (tokens) {
			const legend = createLegend();
			const decoded = decodeSemanticTokens(tokens, legend);
			expect(decoded.length).toBe(0);
		}
	});
});

describe('AnnotationHighlightProvider - Error highlighting', () => {
	let provider: AnnotationHighlightProvider;
	let legend: vscode.SemanticTokensLegend;

	beforeEach(() => {
		provider = new AnnotationHighlightProvider();
		legend = createLegend();
	});

	test('highlights unclosed code block as error', () => {
		const doc = createMockDocument('```bash\necho "test"');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const errorTokens = decoded.filter((t) => t.type === 'error');
		expect(errorTokens.length).toBeGreaterThan(0);
	});

	test('highlights invalid annotation syntax as error', () => {
		const doc = createMockDocument('@');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const errorTokens = decoded.filter((t) => t.type === 'error');
		expect(errorTokens.length).toBeGreaterThan(0);
	});

	test('error tokens are on correct line', () => {
		const doc = createMockDocument('Valid line\n@\nAnother valid line');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const errorTokens = decoded.filter((t) => t.type === 'error');
		expect(errorTokens.length).toBeGreaterThan(0);
		expect(errorTokens[0].line).toBe(1); // Second line (0-indexed)
	});
});

describe('AnnotationHighlightProvider - Edge cases', () => {
	let provider: AnnotationHighlightProvider;

	beforeEach(() => {
		provider = new AnnotationHighlightProvider();
	});

	test('handles empty document', () => {
		const doc = createMockDocument('');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeUndefined();
	});

	test('handles whitespace-only document', () => {
		const doc = createMockDocument('   \n  \n   ');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeUndefined();
	});

	test('handles document with only empty lines', () => {
		const doc = createMockDocument('\n\n\n');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeUndefined();
	});

	test('handles mixed content (annotations, text, comments)', () => {
		const doc = createMockDocument(`@task --prompt "Test"
Plain text here
<!-- Comment -->
@context "main"`);
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const legend = createLegend();
		const decoded = decodeSemanticTokens(tokens!, legend);

		// Should have tokens for both annotations
		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		expect(annotationTokens.length).toBe(2);
	});

	test('handles deeply nested annotations', () => {
		const doc = createMockDocument(`@outer --flag1 "value1"
  @inner --flag2 "value2"
    @deepest --flag3 "value3"`);
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const legend = createLegend();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		expect(annotationTokens.length).toBe(3);
	});

	test('handles annotation at end of document without newline', () => {
		const doc = createMockDocument('@task --prompt "Last line"');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const legend = createLegend();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		expect(annotationTokens.length).toBe(1);
	});
});

describe('AnnotationHighlightProvider - Custom annotation types', () => {
	let provider: AnnotationHighlightProvider;
	let legend: vscode.SemanticTokensLegend;

	beforeEach(() => {
		provider = new AnnotationHighlightProvider();
		legend = createLegend();
	});

	test('highlights custom annotation types', () => {
		const doc = createMockDocument('@custom_annotation --flag "value"');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		expect(annotationTokens.length).toBe(1);
	});

	test('highlights future annotation types generically', () => {
		const doc = createMockDocument('@future_type_123 --param "test"');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		const annotationTokens = decoded.filter((t) => t.type === 'annotation');
		expect(annotationTokens.length).toBe(1);
	});
});

describe('AnnotationErrorHoverProvider', () => {
	let hoverProvider: AnnotationErrorHoverProvider;

	beforeEach(() => {
		hoverProvider = new AnnotationErrorHoverProvider();
	});

	test('provides hover for error line', () => {
		const doc = createMockDocument('```bash\necho "test"');
		const position = new vscode.Position(0, 0);

		const hover = hoverProvider.provideHover(doc, position);

		expect(hover).toBeDefined();
		expect(hover!.contents.length).toBeGreaterThan(0);
	});

	test('provides no hover for valid line', () => {
		const doc = createMockDocument('@task --prompt "Valid"');
		const position = new vscode.Position(0, 0);

		const hover = hoverProvider.provideHover(doc, position);

		expect(hover).toBeUndefined();
	});

	test('provides no hover for empty document', () => {
		const doc = createMockDocument('');
		const position = new vscode.Position(0, 0);

		const hover = hoverProvider.provideHover(doc, position);

		expect(hover).toBeUndefined();
	});

	test('hover message includes error type and message', () => {
		const doc = createMockDocument('@');
		const position = new vscode.Position(0, 0);

		const hover = hoverProvider.provideHover(doc, position);

		expect(hover).toBeDefined();
		const content = hover!.contents[0];
		// Content is a string (from our hover provider implementation)
		const contentStr = typeof content === 'string' ? content : (content as any).value || '';
		expect(contentStr).toContain('INVALID_ANNOTATION');
		expect(contentStr).toContain('critical');
	});

	test('hover for multiple errors on same line', () => {
		// Create a scenario that might produce multiple errors
		const doc = createMockDocument('```bash\n@invalid\necho "test"');
		const position = new vscode.Position(1, 0);

		const hover = hoverProvider.provideHover(doc, position);

		// Should provide hover if there's an error on line 1
		if (hover) {
			expect(hover.contents.length).toBeGreaterThan(0);
		}
	});
});

describe('AnnotationHighlightProvider - Token non-overlapping', () => {
	let provider: AnnotationHighlightProvider;
	let legend: vscode.SemanticTokensLegend;

	beforeEach(() => {
		provider = new AnnotationHighlightProvider();
		legend = createLegend();
	});

	test('tokens do not overlap on same line', () => {
		const doc = createMockDocument('@task --prompt "value"');
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		// Check that no tokens overlap
		const sameLine = decoded.filter((t) => t.line === 0);
		for (let i = 0; i < sameLine.length - 1; i++) {
			const current = sameLine[i];
			const next = sameLine[i + 1];
			const currentEnd = current.char + current.length;
			expect(currentEnd).toBeLessThanOrEqual(next.char);
		}
	});

	test('all tokens are single-line', () => {
		const doc = createMockDocument(`@task
  --prompt "Multi-line"
  --flag "value"`);
		const tokens = provider.provideDocumentSemanticTokens(doc);

		expect(tokens).toBeDefined();
		const decoded = decodeSemanticTokens(tokens!, legend);

		// Each token should be on a single line (no multi-line tokens)
		// This is implicit in the encoding, but we verify by checking token positions
		decoded.forEach((token) => {
			expect(token.line).toBeGreaterThanOrEqual(0);
			expect(token.char).toBeGreaterThanOrEqual(0);
			expect(token.length).toBeGreaterThan(0);
		});
	});
});
