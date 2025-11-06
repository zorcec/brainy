/**
 * Module: skills/built-in/execute.ts
 *
 * Description:
 *   Execute skill for running code blocks from playbooks.
 *   Finds the next code block after the current skill invocation and executes it.
 *   Captures and returns the output as a string.
 *
 *   Supported languages: bash, sh, python, javascript, typescript (node)
 *   Execution is done via Node.js child_process.execSync.
 *
 * Usage:
 *   @execute
 *   
 *   ```bash
 *   echo "Hello, World!"
 *   ```
 *
 *   @execute --variable "result"
 *   
 *   ```bash
 *   echo "This will be stored in the 'result' variable"
 *   ```
 *
 * Parameters:
 *   --variable (optional): Name of variable to store the execution output
 *
 * Behavior:
 *   - Finds the immediate next block after the current skill
 *   - Validates it's a code block with language metadata
 *   - Executes the code and captures stdout/stderr
 *   - Returns output as a string
 *   - Optionally stores output in a variable for later use
 *   - Throws error if next block is not a code block or execution fails
 */

import type { Skill, SkillApi, SkillParams } from '../types';

// Conditional imports for Node.js-only environments
let execSync: typeof import('child_process').execSync;
let writeFileSync: typeof import('fs').writeFileSync;
let unlinkSync: typeof import('fs').unlinkSync;
let join: typeof import('path').join;
let tmpdir: typeof import('os').tmpdir;
try {
	const childProcess = require('child_process');
	const fs = require('fs');
	const path = require('path');
	const os = require('os');
	execSync = childProcess.execSync;
	writeFileSync = fs.writeFileSync;
	unlinkSync = fs.unlinkSync;
	join = path.join;
	tmpdir = os.tmpdir;
} catch {
	// Node.js modules not available in browser/web environments
}

/**
 * Maps language identifiers to execution commands.
 */
const LANGUAGE_EXECUTORS: Record<string, { command: string; extension: string }> = {
	bash: { command: 'bash', extension: '.sh' },
	sh: { command: 'sh', extension: '.sh' },
	python: { command: 'python3', extension: '.py' },
	python3: { command: 'python3', extension: '.py' },
	javascript: { command: 'node', extension: '.js' },
	js: { command: 'node', extension: '.js' },
	typescript: { command: 'ts-node', extension: '.ts' },
	ts: { command: 'ts-node', extension: '.ts' }
};

/**
 * Execute skill implementation.
 */
export const executeSkill: Skill = {
	name: 'execute',
	description: 'Execute the next code block in the playbook and return its output.',
	params: [
		{ name: 'variable', description: 'Variable name to store the execution output', required: false }
	],
	
	async execute(api: SkillApi, params: SkillParams) {
		// Check if execSync is available (Node.js environment)
		if (!execSync) {
			throw new Error('Execute skill is not available in web/browser environments. This skill requires Node.js.');
		}
		
		// Get current state from API
		const blocks = api.getParsedBlocks();
		const currentIndex = api.getCurrentBlockIndex();
		
		// Find next block
		const nextIndex = currentIndex + 1;
		if (nextIndex >= blocks.length) {
			throw new Error('No code block found after execute skill. Ensure there is a code block immediately following the @execute annotation.');
		}
		
		const nextBlock = blocks[nextIndex];
		
		// Validate it's a code block
		if (nextBlock.name !== 'plainCodeBlock') {
			throw new Error(`Next block is not a code block. Found: ${nextBlock.name}. Ensure a code block (enclosed in triple backticks) follows the @execute annotation.`);
		}
		
		// Extract language and code
		const language = nextBlock.metadata?.language;
		if (!language) {
			throw new Error('Code block is missing language metadata. Specify a language after the opening backticks (e.g., ```bash).');
		}
		
		const code = nextBlock.content;
		if (!code || code.trim() === '') {
			throw new Error('Code block is empty. Provide code to execute.');
		}
		
		// Check if language is supported
		const executor = LANGUAGE_EXECUTORS[language.toLowerCase()];
		if (!executor) {
			const supported = Object.keys(LANGUAGE_EXECUTORS).join(', ');
			throw new Error(`Unsupported language: ${language}. Supported languages: ${supported}`);
		}
		
		// Execute the code
		try {
			const output = executeCode(code, executor.command, executor.extension);
			
			// Store output in variable if --variable flag is provided
			const variableName = params.variable;
			if (variableName) {
				api.setVariable(variableName, output);
			}
			
			// Add output to context automatically as assistant
			api.addToContext('assistant', output);
			
			return {
				messages: [{
					role: 'assistant',
					content: output
				}]
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Code execution failed: ${error.message}`);
			}
			throw new Error('Code execution failed with unknown error');
		}
	}
};

/**
 * Executes code using the specified command.
 * Writes code to a temporary file, executes it, and captures output.
 *
 * @param code - The code to execute
 * @param command - The command to run (e.g., 'bash', 'python3', 'node')
 * @param extension - File extension for the temporary file
 * @returns The combined stdout and stderr output
 * @throws Error if execution fails
 */
function executeCode(code: string, command: string, extension: string): string {
	// Create temporary file
	const tempFile = join(tmpdir(), `brainy-execute-${Date.now()}${extension}`);
	
	try {
		// Write code to file
		writeFileSync(tempFile, code, 'utf-8');
		
		// Execute with timeout (30 seconds)
		const output = execSync(`${command} ${tempFile}`, {
			encoding: 'utf-8',
			timeout: 30000,
			maxBuffer: 10 * 1024 * 1024, // 10MB
			cwd: process.cwd() // Use project root as working directory
		});
		
		return output.trim();
	} finally {
		// Clean up temporary file
		try {
			unlinkSync(tempFile);
		} catch {
			// Ignore cleanup errors
		}
	}
}
