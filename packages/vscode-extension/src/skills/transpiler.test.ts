/**
 * Tests for skills/transpiler.ts
 */

import { describe, it, expect } from 'vitest';
import { transpileSkill } from './transpiler';

describe('transpileSkill', () => {
	it('transpiles simple TypeScript to JavaScript', () => {
		const tsCode = `
			interface Params {
				name: string;
			}
			const greet = (params: Params): string => {
				return \`Hello, \${params.name}!\`;
			};
		`;

		const jsCode = transpileSkill(tsCode);
		expect(jsCode).toBeTruthy();
		expect(jsCode).toContain('greet');
		expect(jsCode).not.toContain('interface');
	});

	it('handles TypeScript with type annotations', () => {
		const tsCode = `
			export const mySkill = {
				name: 'test',
				async execute(api: any, params: { value: string }): Promise<any> {
					return { messages: [] };
				}
			};
		`;

		const jsCode = transpileSkill(tsCode);
		expect(jsCode).toBeTruthy();
		expect(jsCode).toContain('mySkill');
		expect(jsCode).toContain('execute');
	});

	it('handles ES6+ features', () => {
		const tsCode = `
			const test = async () => {
				const result = await Promise.resolve('test');
				return result;
			};
		`;

		const jsCode = transpileSkill(tsCode);
		expect(jsCode).toBeTruthy();
		expect(jsCode).toContain('test');
	});

	it('throws error for empty input', () => {
		expect(() => transpileSkill('')).toThrow('TypeScript code must be a non-empty string');
	});

	it('throws error for non-string input', () => {
		expect(() => transpileSkill(null as any)).toThrow('TypeScript code must be a non-empty string');
		expect(() => transpileSkill(undefined as any)).toThrow('TypeScript code must be a non-empty string');
	});

	it('handles syntax errors gracefully', () => {
		const tsCode = 'const x = {';
		
		// Transpiler might still produce output despite syntax errors
		// Check that it doesn't throw
		const result = transpileSkill(tsCode);
		expect(result).toBeTruthy();
	});

	it('preserves module exports', () => {
		const tsCode = `
			export const skill = {
				name: 'test',
				execute: async () => ({ messages: [] })
			};
		`;

		const jsCode = transpileSkill(tsCode);
		expect(jsCode).toBeTruthy();
		expect(jsCode).toContain('exports');
	});
});
