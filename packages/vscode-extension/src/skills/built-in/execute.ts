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

import type { Skill, SkillApi, SkillParams, SkillResult, SkillMessage } from '../types';

// Conditional imports for Node.js-only environments
let execSync: typeof import('child_process').execSync;
let writeFileSync: typeof import('fs').writeFileSync;
let unlinkSync: typeof import('fs').unlinkSync;
let existsSync: typeof import('fs').existsSync;
let join: typeof import('path').join;
let pathDelimiter: string;
let tmpdir: typeof import('os').tmpdir;
try {
	const childProcess = require('child_process');
	const fs = require('fs');
	const path = require('path');
	const os = require('os');
	execSync = childProcess.execSync;
	writeFileSync = fs.writeFileSync;
	unlinkSync = fs.unlinkSync;
	existsSync = fs.existsSync;
	join = path.join;
	pathDelimiter = path.delimiter;
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
		
		// Get workspace root for setting working directory
		const workspaceRoot = api.getWorkspaceRoot();
		
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
			// Execute code. executeCode now returns { output, returned }
			// but keep compatibility if a plain string is returned.
			const execResult: any = executeCode(code, executor.command, executor.extension, workspaceRoot);

			let outputText: string;
			let returnedValue: string | undefined;
			if (typeof execResult === 'string') {
				outputText = execResult;
			} else {
				outputText = execResult.output || '';
				returnedValue = execResult.returned;
			}

			// If the executed code returned a value (via the marker), add it as an agent message
			const messages: SkillMessage[] = [];
			if (returnedValue !== undefined) {
				messages.push({ role: 'agent', content: returnedValue } as SkillMessage);
			}

			// Also include the raw stdout as assistant content (if any)
			if (outputText && outputText.trim() !== '') {
				messages.push({ role: 'assistant', content: outputText.trim() } as SkillMessage);
			}

			// Store the returned value OR the stdout in a variable if requested (prefer returnedValue)
			const variableName = params.variable;
			if (variableName) {
				const toStore = returnedValue !== undefined ? returnedValue : outputText;
				api.setVariable(variableName, toStore);
			}

			return { messages };
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
 * @param workspaceRoot - Workspace root path to use as working directory
 * @returns The combined stdout and stderr output
 * @throws Error if execution fails
 */
function executeCode(code: string, command: string, extension: string, workspaceRoot: string): { output: string; returned?: string } {
	// Create temporary file
	const tempFile = join(tmpdir(), `brainy-execute-${Date.now()}${extension}`);

	try {
		// If JS/TS, wrap code so it can return a value via a marker
		let codeToWrite = code;
		const marker = '__BRAINY_RETURN__';
		if (extension === '.js' || extension === '.ts') {
			// Wrap user code in an async IIFE that captures a returned value and logs a marker + JSON
			codeToWrite = `(async () => {\ntry {\n  const __brainy_result = await (async () => { ${code}\n  })();\n  // Print marker and JSON-encoded result on its own line\n  try {\n    console.log('${marker}' + JSON.stringify(__brainy_result));\n  } catch(e) {\n    console.log('${marker}' + JSON.stringify(String(__brainy_result)));\n  }\n} catch (err) {\n  console.error(err);\n  process.exit(1);\n}\n})();`;
		}

		// Write code to file
		writeFileSync(tempFile, codeToWrite, 'utf-8');

		// Prepare environment so child process can resolve project-local node_modules
		const env = { ...(process.env || {}) } as NodeJS.ProcessEnv;

		try {
			// Prepend workspace/node_modules to NODE_PATH so require() can resolve project deps
			if (workspaceRoot && existsSync) {
				const nm = join(workspaceRoot, 'node_modules');
				if (existsSync(nm)) {
					const prev = env.NODE_PATH || '';
					env.NODE_PATH = prev ? `${nm}${pathDelimiter}${prev}` : nm;
				}
			}
		} catch {
			// Ignore NODE_PATH adjustments if something goes wrong
		}

		// If executing TypeScript, prefer to run with node -r ts-node/register using project's ts-node
		const isTypescript = extension === '.ts' || command === 'ts-node';

		// Try to prefer local .bin executable if available (e.g., node, ts-node installed locally)
		let execCommand = command;
		try {
			if (workspaceRoot && existsSync) {
				const localBin = join(workspaceRoot, 'node_modules', '.bin', command);
				if (existsSync(localBin)) {
					execCommand = localBin;
				}
			}
		} catch {
			// ignore
		}

		let fullCommand: string;

		if (isTypescript) {
			// Prefer node -r ts-node/register <tempFile>
			// Check for project's ts-node register path
			let nodeCmd = 'node';
			try {
				if (workspaceRoot && existsSync) {
					const localNode = join(workspaceRoot, 'node_modules', '.bin', 'node');
					if (existsSync(localNode)) nodeCmd = localNode;
				}
			} catch {
				// ignore
			}

			// If project has ts-node installed, require register so TypeScript can run
			// Otherwise, if execCommand points to a ts-node binary, use it directly
			const projectTsNode = workspaceRoot ? join(workspaceRoot, 'node_modules', 'ts-node') : undefined;
			if (projectTsNode && existsSync && existsSync(projectTsNode)) {
				fullCommand = `${nodeCmd} -r ts-node/register ${tempFile}`;
			} else if (execCommand && execCommand.endsWith('ts-node')) {
				fullCommand = `${execCommand} ${tempFile}`;
			} else {
				// Provide helpful error if ts-node isn't available
				throw new Error('TypeScript execution requires ts-node to be installed in the workspace (npm install --save-dev ts-node)');
			}
		} else {
			// Normal execution: use resolved execCommand
			fullCommand = `${execCommand} ${tempFile}`;
		}

		// Execute with timeout (30 seconds)
		const output = execSync(fullCommand, {
			encoding: 'utf-8',
			timeout: 30000,
			maxBuffer: 10 * 1024 * 1024, // 10MB
			cwd: workspaceRoot, // Use workspace root as working directory
			env
		});

		// If wrapper was used, detect special returned value marker
		const strOut = output.toString();
		let returned: string | undefined;
		const idx = strOut.indexOf(marker);
		if (idx !== -1) {
			const rest = strOut.slice(idx + marker.length).split('\n')[0];
			try {
				const parsed = JSON.parse(rest);
				returned = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
			} catch {
				returned = rest;
			}
		}

		return { output: strOut.trim(), returned };
	} finally {
		// Clean up temporary file
		try {
			unlinkSync(tempFile);
		} catch {
			// Ignore cleanup errors
		}
	}
}
