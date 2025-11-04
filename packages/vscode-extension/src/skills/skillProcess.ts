/**
 * Module: skills/skillProcess.ts
 *
 * Description:
 *   Standalone Node.js script that runs in an isolated child process to execute skills.
 *   Receives skill path and parameters via IPC, loads the skill, executes it, and returns the result.
 *   Only Node.js APIs are available in this process - no VS Code APIs.
 *   The working directory is set to the project root by the parent process.
 *
 * IPC Protocol:
 *   Parent -> Child: { type: 'execute', skillPath: string, params: SkillParams, projectRoot: string }
 *   Child -> Parent: { type: 'result', result: string } | { type: 'error', error: string }
 *   Child -> Parent: { type: 'request', requestId: string, role: string, content: string, modelId?: string }
 *   Parent -> Child: { type: 'response', requestId: string, response: string } | { type: 'request-error', requestId: string, error: string }
 *
 * Usage:
 *   This script is forked by skillLoader.ts and should not be imported directly.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Parameters passed to skill execution.
 */
type SkillParams = Record<string, string | undefined>;

/**
 * Message structure for skill results.
 */
interface SkillMessage {
	role: 'user' | 'assistant';
	content: string;
}

/**
 * Result object returned by skill execution.
 */
interface SkillResult {
	messages: SkillMessage[];
}

/**
 * API provided to skills for interacting with the parent extension process.
 */
interface SkillApi {
	sendRequest(role: 'user' | 'assistant', content: string, modelId?: string): Promise<{ response: string }>;
	selectChatModel(modelId: string): Promise<void>;
}

/**
 * Skill interface that all skills must implement.
 */
interface Skill {
	name: string;
	description: string;
	execute(api: SkillApi, params: SkillParams): Promise<SkillResult>;
}

/**
 * Tracks pending requests to the parent process.
 */
const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>();

/**
 * Request counter for generating unique request IDs.
 */
let requestIdCounter = 0;

/**
 * Creates a SkillApi implementation that communicates with the parent process via IPC.
 */
function createSkillApi(): SkillApi {
	return {
		async sendRequest(role, content, modelId) {
			const requestId = `req-${++requestIdCounter}`;
			
			return new Promise((resolve, reject) => {
				// Store the pending request
				pendingRequests.set(requestId, { resolve, reject });
				
				// Send the request to the parent process
				if (process.send) {
					process.send({
						type: 'request',
						requestId,
						role,
						content,
						modelId
					});
				} else {
					reject(new Error('No IPC channel available'));
				}
				
				// Timeout after 30 seconds
				setTimeout(() => {
					if (pendingRequests.has(requestId)) {
						pendingRequests.delete(requestId);
						reject(new Error('Request timeout'));
					}
				}, 30000);
			});
		},

		async selectChatModel(modelId) {
			const requestId = `model-${++requestIdCounter}`;
			
			return new Promise((resolve, reject) => {
				// Store the pending request
				pendingRequests.set(requestId, { resolve, reject });
				
				// Send the request to the parent process
				if (process.send) {
					process.send({
						type: 'select-model',
						requestId,
						modelId
					});
				} else {
					reject(new Error('No IPC channel available'));
				}
				
				// Timeout after 5 seconds
				setTimeout(() => {
					if (pendingRequests.has(requestId)) {
						pendingRequests.delete(requestId);
						reject(new Error('Model selection timeout'));
					}
				}, 5000);
			});
		}
	};
}

/**
 * Registers ts-node for TypeScript support if not already registered.
 */
let tsNodeRegistered = false;

function registerTsNode(): void {
	if (tsNodeRegistered) {
		return;
	}

	try {
		require('ts-node/register');
		tsNodeRegistered = true;
	} catch (error) {
		throw new Error(`Failed to register ts-node: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Loads a skill module from the given path.
 */
async function loadSkillModule(skillPath: string): Promise<Skill> {
	// Register ts-node if loading a TypeScript file
	if (skillPath.endsWith('.ts')) {
		registerTsNode();
	}

	// Load the skill module
	// Clear require cache to support hot-reloading
	delete require.cache[require.resolve(skillPath)];
	const module = require(skillPath);

	// Extract the skill object
	// Support both default export and named exports
	const skillName = path.basename(skillPath, path.extname(skillPath));
	const skill = module.default || module[`${skillName}Skill`] || module;

	// Validate the skill object
	if (!skill || typeof skill !== 'object') {
		throw new Error(`Skill module at ${skillPath} must export a Skill object`);
	}

	if (!skill.name || typeof skill.name !== 'string') {
		throw new Error(`Skill at ${skillPath} must have a 'name' property (string)`);
	}

	if (!skill.description || typeof skill.description !== 'string') {
		throw new Error(`Skill at ${skillPath} must have a 'description' property (string)`);
	}

	if (!skill.execute || typeof skill.execute !== 'function') {
		throw new Error(`Skill at ${skillPath} must have an 'execute' property (async function)`);
	}

	return skill as Skill;
}

/**
 * Executes a skill with the provided parameters.
 */
async function executeSkill(skillPath: string, params: SkillParams): Promise<SkillResult> {
	const skill = await loadSkillModule(skillPath);
	const api = createSkillApi();
	const result = await skill.execute(api, params);

	// Validate result structure
	if (typeof result !== 'object' || result === null) {
		throw new Error('Skill execute function must return an object with messages array');
	}

	if (!Array.isArray(result.messages)) {
		throw new Error('Skill result must have a messages array');
	}

	// Validate each message
	for (const message of result.messages) {
		if (typeof message !== 'object' || message === null) {
			throw new Error('Each message must be an object');
		}
		if (message.role !== 'user' && message.role !== 'assistant') {
			throw new Error('Each message must have role "user" or "assistant"');
		}
		if (typeof message.content !== 'string') {
			throw new Error('Each message must have a string content property');
		}
	}

	return result;
}

/**
 * Handles messages from the parent process.
 */
process.on('message', async (message: any) => {
	if (!message || typeof message !== 'object') return;

	// Handle execute command
	if (message.type === 'execute') {
		try {
			const { skillPath, params } = message;
			const result = await executeSkill(skillPath, params);
			process.send?.({ type: 'result', result });
		} catch (error) {
			process.send?.({
				type: 'error',
				error: error instanceof Error ? error.message : String(error)
			});
		}
		return;
	}

	// Generalized response/error handling for requests
	type Message = { type: string; requestId?: string; response?: string; error?: string };
	type Pending = { resolve: (value: any) => void; reject: (error: any) => void };

	const responseTypes: Record<string, (msg: Message) => { value: any }> = {
		'response': (msg) => ({ value: { response: msg.response } }),
		'model-selected': () => ({ value: undefined }),
	};
	const errorTypes: Record<string, (msg: Message) => { error: any }> = {
		'request-error': (msg) => ({ error: msg.error }),
		'model-error': (msg) => ({ error: msg.error }),
	};

	if ((message as Message).requestId) {
		const pending: Pending | undefined = pendingRequests.get((message as Message).requestId!);
		if (pending) {
			pendingRequests.delete((message as Message).requestId!);
			if (responseTypes[(message as Message).type]) {
				pending.resolve(responseTypes[(message as Message).type](message).value);
			} else if (errorTypes[(message as Message).type]) {
				pending.reject(new Error(errorTypes[(message as Message).type](message).error));
			}
		}
	}
});

/**
 * Handle process errors.
 */
process.on('uncaughtException', (error) => {
	if (process.send) {
		process.send({
			type: 'error',
			error: error instanceof Error ? error.message : String(error)
		});
	}
	process.exit(1);
});

process.on('unhandledRejection', (error) => {
	if (process.send) {
		process.send({
			type: 'error',
			error: error instanceof Error ? error.message : String(error)
		});
	}
	process.exit(1);
});
