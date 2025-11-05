/**
 * Unit tests for playbookExecutor module
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setExecutionState, resetAllExecutionState } from './executionState';

// Mock skill loader module
vi.mock('../skills/skillLoader', () => ({
	loadSkill: vi.fn(async (skillName: string) => ({
		name: skillName,
		skillPath: `/mock/path/${skillName}.ts`,
		isBuiltIn: false,
	})),
	executeSkill: vi.fn(async () => ({
		messages: [
			{ role: 'assistant', content: 'Mock skill result' }
		]
	})),
}));

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

	class MockUri {
		constructor(public fsPath: string) {}
		toString() {
			return this.fsPath;
		}
		static parse(path: string) {
			return new MockUri(path);
		}
	}

	return {
		window: {
			createTextEditorDecorationType: vi.fn(() => ({
				dispose: vi.fn(),
			})),
		},
		Range: MockRange,
		ThemeColor: MockThemeColor,
		Uri: MockUri,
	};
});

import { executePlaybook, stopPlaybookExecution } from './playbookExecutor';
import type { AnnotationBlock } from '../parser';
import type * as vscode from 'vscode';

// Mock editor interface
interface MockTextEditor {
	document: {
		uri: any;
	};
	setDecorations: ReturnType<typeof vi.fn>;
}

describe('playbookExecutor', () => {
	let mockEditor: MockTextEditor;
	const testUri = 'file:///test.brainy.md';

	beforeEach(() => {
		mockEditor = {
			document: {
				uri: {
					toString: () => testUri,
					fsPath: '/test.brainy.md',
				},
			},
			setDecorations: vi.fn(),
		};
		resetAllExecutionState();
	});

	describe('executePlaybook', () => {
		test('executes all blocks sequentially', async () => {
			const blocks: AnnotationBlock[] = [
				{ name: 'task', flags: [], content: 'Task 1', line: 1 },
				{ name: 'task', flags: [], content: 'Task 2', line: 2 },
			];

			const onProgress = vi.fn();
			const onComplete = vi.fn();

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress,
				undefined,
				onComplete
			);

			expect(onProgress).toHaveBeenCalledTimes(2);
			expect(onComplete).toHaveBeenCalledOnce();
		});

		test('skips plainText blocks', async () => {
			const blocks: AnnotationBlock[] = [
				{ name: 'plainText', flags: [], content: 'Some text', line: 1 },
				{ name: 'task', flags: [], content: 'Task 1', line: 2 },
			];

			const onProgress = vi.fn();

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			expect(onProgress).toHaveBeenCalledTimes(2);
		});

		test('skips plainComment blocks', async () => {
			const blocks: AnnotationBlock[] = [
				{ name: 'plainComment', flags: [], content: 'A comment', line: 1 },
				{ name: 'task', flags: [], content: 'Task 1', line: 2 },
			];

			const onProgress = vi.fn();

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			expect(onProgress).toHaveBeenCalledTimes(2);
		});

		test('stops execution when state is stopped', async () => {
			const blocks: AnnotationBlock[] = [
				{ name: 'task', flags: [], content: 'Task 1', line: 1 },
				{ name: 'task', flags: [], content: 'Task 2', line: 2 },
			];

			const onProgress = vi.fn();

			// Start running, then immediately stop
			setExecutionState(testUri, 'running');
			setExecutionState(testUri, 'stopped');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			// Should not execute any blocks
			expect(onProgress).not.toHaveBeenCalled();
		});

		test('waits while paused and resumes', async () => {
			const blocks: AnnotationBlock[] = [
				{ name: 'task', flags: [], content: 'Task 1', line: 1 },
			];

			const onProgress = vi.fn();

			setExecutionState(testUri, 'running');

			// Pause after a short delay, then resume
			setTimeout(() => {
				setExecutionState(testUri, 'paused');
			}, 50);

			setTimeout(() => {
				setExecutionState(testUri, 'running');
			}, 200);

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			expect(onProgress).toHaveBeenCalledOnce();
		}, 10000); // Increase timeout for this test

		test('clears decorations on completion', async () => {
			const blocks: AnnotationBlock[] = [
				{ name: 'task', flags: [], content: 'Task 1', line: 1 },
			];

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks
			);

			// Should call setDecorations to clear
			expect(mockEditor.setDecorations).toHaveBeenCalled();
		});
	});

	describe('stopPlaybookExecution', () => {
		test('resets state and clears decorations', () => {
			setExecutionState(testUri, 'running');

			stopPlaybookExecution(mockEditor as unknown as vscode.TextEditor);

			// Should call setDecorations to clear
			expect(mockEditor.setDecorations).toHaveBeenCalled();
		});
	});
});
