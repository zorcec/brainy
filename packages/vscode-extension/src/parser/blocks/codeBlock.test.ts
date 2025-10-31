/**
 * Unit tests for code block parsing.
 * Tests all edge cases and behaviors defined in the story specification.
 */

import { describe, test, expect } from 'vitest';
import {
	isCodeFenceOpen,
	isCodeFenceClose,
	extractLanguage,
	parseCodeBlock,
	createCodeBlock
} from './codeBlock';

describe('codeBlock - Code Fence Detection', () => {
	test('detects opening code fence', () => {
		expect(isCodeFenceOpen('```')).toBe(true);
		expect(isCodeFenceOpen('```python')).toBe(true);
		expect(isCodeFenceOpen('```bash')).toBe(true);
		expect(isCodeFenceOpen('  ```  ')).toBe(true); // with whitespace
	});

	test('does not detect non-fence lines as opening', () => {
		expect(isCodeFenceOpen('text')).toBe(false);
		expect(isCodeFenceOpen('@annotation')).toBe(false);
		expect(isCodeFenceOpen('`` two backticks')).toBe(false);
	});

	test('detects closing code fence', () => {
		expect(isCodeFenceClose('```')).toBe(true);
		expect(isCodeFenceClose('  ```  ')).toBe(true); // with whitespace
	});

	test('does not detect non-fence lines as closing', () => {
		expect(isCodeFenceClose('```python')).toBe(false);
		expect(isCodeFenceClose('text')).toBe(false);
		expect(isCodeFenceClose('`` two backticks')).toBe(false);
	});
});

describe('codeBlock - Language Extraction', () => {
	test('extracts language from code fence', () => {
		expect(extractLanguage('```python')).toBe('python');
		expect(extractLanguage('```bash')).toBe('bash');
		expect(extractLanguage('```typescript')).toBe('typescript');
	});

	test('returns undefined for fence with no language', () => {
		expect(extractLanguage('```')).toBeUndefined();
	});

	test('returns undefined for non-fence lines', () => {
		expect(extractLanguage('text')).toBeUndefined();
		expect(extractLanguage('@annotation')).toBeUndefined();
	});
});

describe('codeBlock - Basic Parsing', () => {
	test('parses code block with language', () => {
		const lines = [
			'```bash',
			'echo "Hello World"',
			'```'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.error).toBeUndefined();
		expect(result.block).toBeDefined();
		expect(result.block?.name).toBe('plainCodeBlock');
		expect(result.block?.content).toBe('echo "Hello World"');
		expect(result.block?.metadata?.language).toBe('bash');
		expect(result.block?.flags).toEqual([]);
		expect(result.nextLine).toBe(3);
	});

	test('parses code block without language', () => {
		const lines = [
			'```',
			'echo "No language"',
			'```'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.error).toBeUndefined();
		expect(result.block).toBeDefined();
		expect(result.block?.name).toBe('plainCodeBlock');
		expect(result.block?.content).toBe('echo "No language"');
		expect(result.block?.metadata?.language).toBeUndefined();
	});

	test('parses empty code block', () => {
		const lines = [
			'```python',
			'```'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.error).toBeUndefined();
		expect(result.block).toBeDefined();
		expect(result.block?.content).toBe('');
		expect(result.block?.metadata?.language).toBe('python');
	});

	test('parses multi-line code block', () => {
		const lines = [
			'```python',
			'def hello():',
			'    print("Hello")',
			'    return True',
			'```'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.error).toBeUndefined();
		expect(result.block).toBeDefined();
		expect(result.block?.content).toBe('def hello():\n    print("Hello")\n    return True');
		expect(result.block?.metadata?.language).toBe('python');
	});
});

describe('codeBlock - Error Handling', () => {
	test('returns critical error for unclosed code block', () => {
		const lines = [
			'```bash',
			'echo "Hello World"'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.block).toBeUndefined();
		expect(result.error).toBeDefined();
		expect(result.error?.type).toBe('UnclosedCodeBlock');
		expect(result.error?.message).toBe('Unclosed code block detected.');
		expect(result.error?.severity).toBe('critical');
	});

	test('returns critical error for unclosed block at end of file', () => {
		const lines = [
			'@execute',
			'```bash',
			'echo "Test"'
		];
		const result = parseCodeBlock(lines, 1);

		expect(result.error).toBeDefined();
		expect(result.error?.type).toBe('UnclosedCodeBlock');
		expect(result.error?.severity).toBe('critical');
	});
});

describe('codeBlock - Edge Cases', () => {
	test('handles code block with only whitespace', () => {
		const lines = [
			'```',
			'   ',
			'```'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.error).toBeUndefined();
		expect(result.block?.content).toBe('   ');
	});

	test('preserves indentation in code content', () => {
		const lines = [
			'```python',
			'def test():',
			'    return True',
			'```'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.block?.content).toBe('def test():\n    return True');
	});

	test('handles code block with special characters', () => {
		const lines = [
			'```bash',
			'echo "$VAR" && echo \'test\' | grep "pattern"',
			'```'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.block?.content).toBe('echo "$VAR" && echo \'test\' | grep "pattern"');
	});

	test('preserves language case sensitivity', () => {
		const lines = [
			'```TypeScript',
			'const x = 1;',
			'```'
		];
		const result = parseCodeBlock(lines, 0);

		expect(result.block?.metadata?.language).toBe('TypeScript');
	});
});

describe('codeBlock - Helper Functions', () => {
	test('createCodeBlock creates valid code block object', () => {
		const block = createCodeBlock('console.log("test")', 'javascript', 5);

		expect(block.name).toBe('plainCodeBlock');
		expect(block.content).toBe('console.log("test")');
		expect(block.metadata?.language).toBe('javascript');
		expect(block.line).toBe(5);
		expect(block.flags).toEqual([]);
	});

	test('createCodeBlock works without language', () => {
		const block = createCodeBlock('plain code');

		expect(block.metadata?.language).toBeUndefined();
		expect(block.content).toBe('plain code');
	});

	test('createCodeBlock works without line number', () => {
		const block = createCodeBlock('code', 'python');

		expect(block.line).toBeUndefined();
	});
});
