/**
 * Unit tests for executionDecorations module
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock VS Code module
vi.mock('vscode', () => {
	class MockRange {
		start: any;
		end: any;
		constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
			this.start = { line: startLine, character: startChar };
			this.end = { line: endLine, character: endChar };
		}
	}

	class MockThemeColor {
		constructor(public id: string) {}
	}

	const decorationTypes: any[] = [];

	return {
		window: {
			createTextEditorDecorationType: vi.fn((options: any) => {
				const decoration = {
					...options,
					dispose: vi.fn(),
				};
				decorationTypes.push(decoration);
				return decoration;
			}),
		},
		Range: MockRange,
		ThemeColor: MockThemeColor,
	};
});

import {
	highlightCurrentSkill,
	highlightFailedSkill,
	clearExecutionDecorations,
	dispose
} from './executionDecorations';
import type * as vscode from 'vscode';

// Mock editor interface
interface MockTextEditor {
	setDecorations: ReturnType<typeof vi.fn>;
}

describe('executionDecorations', () => {
	let mockEditor: MockTextEditor;

	beforeEach(() => {
		mockEditor = {
			setDecorations: vi.fn(),
		};
	});

	describe('highlightCurrentSkill', () => {
		test('highlights the specified line', () => {
			highlightCurrentSkill(mockEditor as unknown as vscode.TextEditor, 5);
			
			expect(mockEditor.setDecorations).toHaveBeenCalledOnce();
			const [decorationType, ranges] = mockEditor.setDecorations.mock.calls[0];
			expect(decorationType).toBeDefined();
			expect(Array.isArray(ranges)).toBe(true);
			expect(ranges.length).toBe(1);
			expect(ranges[0].start.line).toBe(5);
		});

		test('highlights line 0 correctly', () => {
			highlightCurrentSkill(mockEditor as unknown as vscode.TextEditor, 0);
			
			expect(mockEditor.setDecorations).toHaveBeenCalledOnce();
			const [, ranges] = mockEditor.setDecorations.mock.calls[0];
			expect(ranges[0].start.line).toBe(0);
		});

		test('can be called multiple times', () => {
			highlightCurrentSkill(mockEditor as unknown as vscode.TextEditor, 1);
			highlightCurrentSkill(mockEditor as unknown as vscode.TextEditor, 2);
			
			expect(mockEditor.setDecorations).toHaveBeenCalledTimes(2);
		});
	});

	describe('highlightFailedSkill', () => {
		test('highlights the specified line', () => {
			highlightFailedSkill(mockEditor as unknown as vscode.TextEditor, 10);
			
			expect(mockEditor.setDecorations).toHaveBeenCalledOnce();
			const [decorationType, ranges] = mockEditor.setDecorations.mock.calls[0];
			expect(decorationType).toBeDefined();
			expect(Array.isArray(ranges)).toBe(true);
			expect(ranges.length).toBe(1);
			expect(ranges[0].start.line).toBe(10);
		});

		test('highlights line 0 correctly', () => {
			highlightFailedSkill(mockEditor as unknown as vscode.TextEditor, 0);
			
			expect(mockEditor.setDecorations).toHaveBeenCalledOnce();
			const [, ranges] = mockEditor.setDecorations.mock.calls[0];
			expect(ranges[0].start.line).toBe(0);
		});
	});

	describe('clearExecutionDecorations', () => {
		test('clears decorations from the editor', () => {
			// First highlight something
			highlightCurrentSkill(mockEditor as unknown as vscode.TextEditor, 5);
			highlightFailedSkill(mockEditor as unknown as vscode.TextEditor, 10);
			
			// Reset mock to check clear calls
			mockEditor.setDecorations.mockClear();
			
			// Clear decorations
			clearExecutionDecorations(mockEditor as unknown as vscode.TextEditor);
			
			// Should call setDecorations with empty arrays
			expect(mockEditor.setDecorations).toHaveBeenCalled();
			const calls = mockEditor.setDecorations.mock.calls;
			expect(calls.length).toBeGreaterThan(0);
			
			// Check that at least one call has an empty array
			const hasEmptyArray = calls.some((call: any) => {
				const [, ranges] = call;
				return Array.isArray(ranges) && ranges.length === 0;
			});
			expect(hasEmptyArray).toBe(true);
		});

		test('does not throw if called without previous highlights', () => {
			expect(() => {
				clearExecutionDecorations(mockEditor as unknown as vscode.TextEditor);
			}).not.toThrow();
		});
	});

	describe('dispose', () => {
		test('can be called without error', () => {
			expect(() => dispose()).not.toThrow();
		});

		test('can be called multiple times', () => {
			dispose();
			dispose();
			expect(true).toBe(true); // No error thrown
		});
	});
});
