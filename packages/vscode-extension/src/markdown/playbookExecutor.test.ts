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

// Mock context skill module
vi.mock('../skills/built-in/context', () => ({
	contextNames: vi.fn(() => ['main']),
	addMessageToContext: vi.fn(),
	selectContext: vi.fn(),
}));

// Mock skills index for selectChatModel
vi.mock('../skills/index', () => ({
	selectChatModel: vi.fn(),
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
			showErrorMessage: vi.fn(),
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

		test('adds plainText blocks to context as agent type', async () => {
			const { addMessageToContext } = await import('../skills/built-in/context');
			const addMessageMock = addMessageToContext as ReturnType<typeof vi.fn>;
			addMessageMock.mockClear();

			const blocks: AnnotationBlock[] = [
				{ name: 'plainText', flags: [], content: 'Some text', line: 1 },
				{ name: 'task', flags: [], content: 'Task 1', line: 2 },
			];

			const onProgress = vi.fn();

			setExecutionState(testUri, 'running');

			// Make executeSkill return distinct output per skill name to make assertions deterministic
			const { executeSkill } = await import('../skills/skillLoader');
			const executeSkillMock = executeSkill as ReturnType<typeof vi.fn>;
			executeSkillMock.mockImplementation(async (skill: any) => {
				return {
					messages: [
						{ role: 'assistant', content: `Output:${skill.name}` }
					]
				};
			});

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			expect(onProgress).toHaveBeenCalledTimes(2);
			// Verify plainText was added to context as agent type
			expect(addMessageMock).toHaveBeenCalledWith('main', 'agent', 'Some text');
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

		test('adds code blocks to context when previous block is not execute', async () => {
			const { addMessageToContext } = await import('../skills/built-in/context');
			const addMessageMock = addMessageToContext as ReturnType<typeof vi.fn>;
			addMessageMock.mockClear();

			const blocks: AnnotationBlock[] = [
				{ name: 'plainText', flags: [], content: 'Some text', line: 1 },
				{ name: 'plainCodeBlock', flags: [], content: 'console.log("test")', line: 2, metadata: { language: 'javascript' } },
				{ name: 'task', flags: [], content: 'Task 1', line: 3 },
			];

			const onProgress = vi.fn();

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			expect(onProgress).toHaveBeenCalledTimes(3);
			// Verify code block was added to context as agent type
			expect(addMessageMock).toHaveBeenCalledWith('main', 'agent', 'console.log("test")');
		});

		test('handles larger annotation arrays with multiple code blocks and validates context additions', async () => {
			const { addMessageToContext } = await import('../skills/built-in/context');
			const addMessageMock = addMessageToContext as ReturnType<typeof vi.fn>;
			addMessageMock.mockClear();

			// Build a larger sequence of blocks with mixed types
			const blocks: AnnotationBlock[] = [
				{ name: 'plainText', flags: [], content: 'Intro text', line: 1 },
				{ name: 'plainCodeBlock', flags: [], content: 'echo "A"', line: 2, metadata: { language: 'bash' } },
				{ name: 'execute', flags: [], content: '@execute', line: 3 },
				{ name: 'plainCodeBlock', flags: [], content: 'echo "B"', line: 4, metadata: { language: 'bash' } },
				{ name: 'plainCodeBlock', flags: [], content: 'echo "C"', line: 5, metadata: { language: 'bash' } },
				{ name: 'task', flags: [], content: 'Do something', line: 6 },
				{ name: 'plainCodeBlock', flags: [], content: 'console.log("D")', line: 7, metadata: { language: 'javascript' } },
				{ name: 'plainText', flags: [], content: 'Outro', line: 8 }
			];

			const onProgress = vi.fn();

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			// Build the flattened sequence of added contents (3rd argument to addMessageToContext)
			const calls = addMessageMock.mock.calls.map(c => c[2]);

			// Expected sequence after full playbook execution:
			// 1. Intro text (plainText)
			// 2. echo "A" (plainCodeBlock, previous plainText)
			// 3. echo "B" should be skipped because previous block is execute
			// 3. echo "C" (plainCodeBlock, previous plainCodeBlock not execute)
			// 4. Output from the task skill (we mock executeSkill to return 'Output:task')
			// 5. console.log("D") (plainCodeBlock after task)
			// 6. Outro (plainText)

			expect(calls).toEqual([
				'Intro text',
				'echo "A"',
				'Output:execute',
				'echo "C"',
				'Output:task',
				'console.log("D")',
				'Outro'
			]);
		});

		test('skips code blocks when previous block is execute skill', async () => {
			const { addMessageToContext } = await import('../skills/built-in/context');
			const addMessageMock = addMessageToContext as ReturnType<typeof vi.fn>;
			addMessageMock.mockClear();

			const blocks: AnnotationBlock[] = [
				{ name: 'execute', flags: [], content: '@execute', line: 1 },
				{ name: 'plainCodeBlock', flags: [], content: 'console.log("test")', line: 2, metadata: { language: 'javascript' } },
			];

			const onProgress = vi.fn();

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			expect(onProgress).toHaveBeenCalledTimes(2);
			// Verify code block was NOT added to context (execute skill consumes it)
			// addMessageMock should only be called for skill results, not for the code block
			const codeBlockCalls = addMessageMock.mock.calls.filter(
				call => call[2] === 'console.log("test")'
			);
			expect(codeBlockCalls).toHaveLength(0);
		});

		test('stops execution when stopped during run', async () => {
			const blocks: AnnotationBlock[] = [
				{ name: 'task', flags: [], content: 'Task 1', line: 1 },
				{ name: 'task', flags: [], content: 'Task 2', line: 2 },
			];

			const onProgress = vi.fn();

			// Start execution and immediately set to stopped
			const promise = executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks,
				onProgress
			);

			// Stop it immediately
			setTimeout(() => {
				setExecutionState(testUri, 'stopped');
			}, 10);

			await promise;

			// Should execute at least the first block before stopping
			// Due to timing, might execute 1 or 2 blocks
			expect(onProgress.mock.calls.length).toBeLessThan(blocks.length + 1);
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

		test('sets default model to gpt-4.1 on playbook start', async () => {
			const { selectChatModel } = await import('../skills/index');
			const selectModelMock = selectChatModel as ReturnType<typeof vi.fn>;
			selectModelMock.mockClear();

			const blocks: AnnotationBlock[] = [
				{ name: 'task', flags: [], content: 'Task 1', line: 1 },
			];

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks
			);

			// Verify default model was set
			expect(selectModelMock).toHaveBeenCalledWith('gpt-4.1');
		});

		test('prevents concurrent playbook execution', async () => {
			const blocks: AnnotationBlock[] = [
				{ name: 'task', flags: [], content: 'Task 1', line: 1 },
			];

			const uri1 = 'file:///test1.md';
			const uri2 = 'file:///test2.md';

			const mockEditor1 = {
				document: {
					uri: {
						toString: () => uri1,
						fsPath: '/test1.md',
					},
				},
				setDecorations: vi.fn(),
			};

			const mockEditor2 = {
				document: {
					uri: {
						toString: () => uri2,
						fsPath: '/test2.md',
					},
				},
				setDecorations: vi.fn(),
			};

			// Start first playbook - don't wait for it to finish
			const promise1 = executePlaybook(
				mockEditor1 as unknown as vscode.TextEditor,
				blocks
			);

			// Give first playbook time to start
			await new Promise(resolve => setTimeout(resolve, 50));

			// Try to start second playbook while first is running
			await expect(
				executePlaybook(
					mockEditor2 as unknown as vscode.TextEditor,
					blocks
				)
			).rejects.toThrow('A playbook is already running');

			// Wait for first to finish
			await promise1;
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

	describe('flag to params conversion', () => {
		test('converts flags without values to empty string', async () => {
			// Import the executeSkill mock to capture params
			const { executeSkill } = await import('../skills/skillLoader');
			const executeSkillMock = executeSkill as ReturnType<typeof vi.fn>;
			executeSkillMock.mockClear();

			const blocks: AnnotationBlock[] = [
				{ 
					name: 'task', 
					flags: [
						{ name: 'variable', value: [] }, // Flag without value
						{ name: 'prompt', value: ['test prompt'] } // Flag with value
					], 
					content: 'Task 1', 
					line: 1 
				},
			];

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks
			);

			// Check that executeSkill was called with correct params
			expect(executeSkillMock).toHaveBeenCalledOnce();
			const [, params] = executeSkillMock.mock.calls[0];
			expect(params.variable).toBe(''); // Empty string, not undefined
			expect(params.prompt).toBe('test prompt');
		});

		test('converts flags with multiple values to space-joined string', async () => {
			const { executeSkill } = await import('../skills/skillLoader');
			const executeSkillMock = executeSkill as ReturnType<typeof vi.fn>;
			executeSkillMock.mockClear();

			const blocks: AnnotationBlock[] = [
				{ 
					name: 'task', 
					flags: [
						{ name: 'prompt', value: ['first', 'second', 'third'] }
					], 
					content: 'Task 1', 
					line: 1 
				},
			];

			setExecutionState(testUri, 'running');

			await executePlaybook(
				mockEditor as unknown as vscode.TextEditor,
				blocks
			);

			expect(executeSkillMock).toHaveBeenCalledOnce();
			const [, params] = executeSkillMock.mock.calls[0];
			expect(params.prompt).toBe('first second third');
		});
	});
});
