/**
 * Module: skills/transpiler.ts
 *
 * Description:
 *   Utility for transpiling TypeScript code to JavaScript.
 *   Used for local skill files (.ts) in the .skills/ folder.
 *   Transpilation is done in-memory using TypeScript's transpileModule API.
 *
 * Usage:
 *   import { transpileSkill } from './skills/transpiler';
 *   
 *   const tsCode = fs.readFileSync('./skill.ts', 'utf8');
 *   const jsCode = transpileSkill(tsCode);
 */

import * as ts from 'typescript';

/**
 * Transpiles TypeScript code to JavaScript.
 * 
 * @param tsCode - TypeScript source code
 * @returns Transpiled JavaScript code
 * @throws Error if transpilation fails
 */
export function transpileSkill(tsCode: string): string {
	if (!tsCode || typeof tsCode !== 'string') {
		throw new Error('TypeScript code must be a non-empty string');
	}

	try {
		const result = ts.transpileModule(tsCode, {
			compilerOptions: {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2020,
				esModuleInterop: true,
				allowSyntheticDefaultImports: true,
				skipLibCheck: true
			}
		});

		return result.outputText;
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		throw new Error(`TypeScript transpilation failed: ${errorMessage}`);
	}
}
