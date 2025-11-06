/**
 * Module: skills/built-in/context.test.ts
 *
 * Description:
 *   Unit tests for the context skill and context management API.
 *   Tests single context selection, message tracking, and API functions.
 *   
 * NOTE: Multiple context support has been removed. Only one context can be selected at a time.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
	contextSkill, 
	contextNames, 
	getContext, 
	selectContext, 
	addMessageToContext,
	appendContext,
	setContext,
	resetState,
	setModelId,
	getModelId,
	setWarningCallback,
	getTokenLimit
} from './context';
import { createMockSkillApi } from '../testUtils';

// Mock vscode module
vi.mock('vscode', () => ({
	lm: {
		selectChatModels: vi.fn(async (criteria: any) => {
			// Only return models for known families
			const knownFamilies = ['gpt-4o', 'gpt-4', 'gpt-4-32k', 'claude-3', 'claude-3-opus', 
				'claude-3-sonnet', 'claude-3-haiku', 'claude-3.5', 'claude-3.5-sonnet', 'gpt-4o-mini'];
			
			if (criteria?.family && knownFamilies.includes(criteria.family)) {
				return [
					{
						id: `copilot-${criteria.family}`,
						vendor: 'copilot',
						family: criteria.family,
						version: '1.0',
						maxInputTokens: 128000,
						countTokens: vi.fn((text: string) => Promise.resolve(Math.ceil(text.length / 4)))
					}
				];
			}
			
			// Return empty array for unknown models
			return [];
		})
	},
	LanguageModelChatMessage: {
		User: vi.fn((content) => ({ role: 1, content })),
		Assistant: vi.fn((content) => ({ role: 2, content }))
	}
}));

describe('contextSkill', () => {
	let mockApi: ReturnType<typeof createMockSkillApi>;

	beforeEach(() => {
		resetState();
		mockApi = createMockSkillApi();
	});

	describe('metadata', () => {
		it('should have correct name', () => {
			expect(contextSkill.name).toBe('context');
		});

		it('should have description', () => {
			expect(contextSkill.description).toBeTruthy();
			expect(typeof contextSkill.description).toBe('string');
		});

		it('should have execute function', () => {
			expect(typeof contextSkill.execute).toBe('function');
		});
	});

	describe('single context selection', () => {
		it('should select a single context by name', async () => {
			const result = await contextSkill.execute(mockApi, { name: 'research' });
			
			expect(result.messages).toHaveLength(1);
			expect(result.messages[0].role).toBe('agent');
			expect(result.messages[0].content).toBe('Context set to: research');
			expect(contextNames()).toBe('research');
		});

		it('should create context if it does not exist', async () => {
			await contextSkill.execute(mockApi, { name: 'new-context' });
			
			const context = await getContext();
			expect(context).toBeDefined();
			expect(context!.name).toBe('new-context');
			expect(context!.messages).toEqual([
				{ role: 'agent', content: 'Context set to: new-context' }
			]);
		});

		it('should switch to existing context', async () => {
			// Create and select first context
			await contextSkill.execute(mockApi, { name: 'context1' });
			addMessageToContext('context1', 'user', 'Hello');
			
			// Switch to another context
			await contextSkill.execute(mockApi, { name: 'context2' });
			expect(contextNames()).toBe('context2');
			
			// Switch back to first context
			await contextSkill.execute(mockApi, { name: 'context1' });
			expect(contextNames()).toBe('context1');
			
			// Verify context1 still has its messages
			const context = await getContext();
			expect(context!.messages).toHaveLength(3);
			expect(context!.messages[0].content).toBe('Context set to: context1');
			expect(context!.messages[1].content).toBe('Hello');
			expect(context!.messages[2].content).toBe('Context set to: context1');
		});

		it('should trim whitespace from context name', async () => {
			const result = await contextSkill.execute(mockApi, { name: '  research  ' });
			
			expect(contextNames()).toBe('research');
			expect(result.messages[0].content).toBe('Context set to: research');
		});
	});

	describe('error handling', () => {
		it('should throw error if no name provided', async () => {
			await expect(contextSkill.execute(mockApi, {})).rejects.toThrow();
		});

		it('should throw error if name is undefined', async () => {
			await expect(contextSkill.execute(mockApi, { name: undefined })).rejects.toThrow();
		});

		it('should throw error if name is empty string', async () => {
			await expect(contextSkill.execute(mockApi, { name: '' })).rejects.toThrow();
		});

		it('should throw error if name is only whitespace', async () => {
			await expect(contextSkill.execute(mockApi, { name: '   ' })).rejects.toThrow();
		});
	});
});

describe('contextNames API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should return undefined initially', () => {
		expect(contextNames()).toBeUndefined();
	});

	it('should return selected context name', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { name: 'test' });
		
		expect(contextNames()).toBe('test');
	});
});

describe('getContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should return undefined initially', async () => {
		expect(await getContext()).toBeUndefined();
	});

	it('should return selected context with messages', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { name: 'ctx1' });
		
		addMessageToContext('ctx1', 'user', 'Hello');
		addMessageToContext('ctx1', 'assistant', 'Hi there');
		
		const context = await getContext();
		expect(context).toBeDefined();
		expect(context!.name).toBe('ctx1');
		expect(context!.messages).toHaveLength(3); // confirmation + 2 messages
		expect(context!.messages[0]).toEqual({ role: 'agent', content: 'Context set to: ctx1' });
		expect(context!.messages[1]).toEqual({ role: 'user', content: 'Hello' });
		expect(context!.messages[2]).toEqual({ role: 'assistant', content: 'Hi there' });
	});
});

describe('selectContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should select context programmatically', () => {
		selectContext('api-ctx1');
		
		expect(contextNames()).toBe('api-ctx1');
	});

	it('should create context if it does not exist', async () => {
		selectContext('new-context');
		
		const context = await getContext();
		expect(context).toBeDefined();
		expect(context!.name).toBe('new-context');
		expect(context!.messages).toHaveLength(0); // No messages yet
	});

	it('should throw error if name is empty string', () => {
		expect(() => selectContext('')).toThrow('Invalid context name: must be non-empty string');
	});

	it('should throw error if name is whitespace-only', () => {
		expect(() => selectContext('   ')).toThrow('Invalid context name: must be non-empty string');
	});
});

describe('addMessageToContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should add message to existing context', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { name: 'test' });
		
		addMessageToContext('test', 'user', 'Hello');
		addMessageToContext('test', 'assistant', 'Hi there');
		
		selectContext('test');
		const context = await getContext();
		
		expect(context!.messages).toHaveLength(3); // confirmation + 2 added messages
		expect(context!.messages[0]).toEqual({ role: 'agent', content: 'Context set to: test' });
		expect(context!.messages[1]).toEqual({ role: 'user', content: 'Hello' });
		expect(context!.messages[2]).toEqual({ role: 'assistant', content: 'Hi there' });
	});

	it('should create context if it does not exist', async () => {
		addMessageToContext('new-context', 'user', 'First message');
		
		selectContext('new-context');
		const context = await getContext();
		
		expect(context!.messages).toHaveLength(1);
		expect(context!.messages[0]).toEqual({ role: 'user', content: 'First message' });
	});

	it('should preserve message order (chronological)', async () => {
		addMessageToContext('chat', 'user', 'Message 1');
		addMessageToContext('chat', 'assistant', 'Message 2');
		addMessageToContext('chat', 'user', 'Message 3');
		addMessageToContext('chat', 'assistant', 'Message 4');
		
		selectContext('chat');
		const context = await getContext();
		
		expect(context!.messages).toHaveLength(4);
		expect(context!.messages[0].content).toBe('Message 1');
		expect(context!.messages[1].content).toBe('Message 2');
		expect(context!.messages[2].content).toBe('Message 3');
		expect(context!.messages[3].content).toBe('Message 4');
	});
});

describe('context isolation', () => {
	beforeEach(() => {
		resetState();
	});

	it('should keep contexts separate', async () => {
		const mockApi = createMockSkillApi();
		
		// Create and populate first context
		await contextSkill.execute(mockApi, { name: 'ctx1' });
		addMessageToContext('ctx1', 'user', 'Context 1 message');
		
		// Create and populate second context
		await contextSkill.execute(mockApi, { name: 'ctx2' });
		addMessageToContext('ctx2', 'user', 'Context 2 message');
		
		// Verify they remain separate
		selectContext('ctx1');
		const ctx1 = await getContext();
		expect(ctx1!.messages[0].content).toBe('Context set to: ctx1');
		expect(ctx1!.messages[1].content).toBe('Context 1 message');
		
		selectContext('ctx2');
		const ctx2 = await getContext();
		expect(ctx2!.messages[0].content).toBe('Context set to: ctx2');
		expect(ctx2!.messages[1].content).toBe('Context 2 message');
	});
});

describe('appendContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should append messages to existing context', async () => {
		addMessageToContext('chat', 'user', 'First');
		
		const batch = [
			{ role: 'user' as const, content: 'Second' },
			{ role: 'assistant' as const, content: 'Third' }
		];
		appendContext('chat', batch);
		
		selectContext('chat');
		const context = await getContext();
		
		expect(context!.messages).toHaveLength(3);
		expect(context!.messages.map(m => m.content)).toEqual(['First', 'Second', 'Third']);
	});

	it('should create context if it does not exist', async () => {
		const messages = [
			{ role: 'user' as const, content: 'Hello' },
			{ role: 'assistant' as const, content: 'World' }
		];
		appendContext('new', messages);
		
		selectContext('new');
		const context = await getContext();
		
		expect(context!.messages).toHaveLength(2);
	});
});

describe('setContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should replace all messages in existing context', async () => {
		addMessageToContext('chat', 'user', 'Old message 1');
		addMessageToContext('chat', 'assistant', 'Old message 2');
		
		const newMessages = [
			{ role: 'user' as const, content: 'New message 1' },
			{ role: 'assistant' as const, content: 'New message 2' }
		];
		setContext('chat', newMessages);
		
		selectContext('chat');
		const context = await getContext();
		
		expect(context!.messages).toHaveLength(2);
		expect(context!.messages[0].content).toBe('New message 1');
		expect(context!.messages[1].content).toBe('New message 2');
	});
});

describe('token limits and truncation', () => {
	beforeEach(() => {
		resetState();
	});

	it('should return correct token limits for known models', async () => {
		expect(await getTokenLimit('gpt-4')).toBe(8192);
		expect(await getTokenLimit('gpt-4-32k')).toBe(32768);
		expect(await getTokenLimit('gpt-4o')).toBe(128000);
		expect(await getTokenLimit('gpt-4o-mini')).toBe(128000);
		expect(await getTokenLimit('claude-3')).toBe(200000);
		expect(await getTokenLimit('claude-3-opus')).toBe(200000);
		expect(await getTokenLimit('claude-3-sonnet')).toBe(200000);
	});

	it('should return default limit for unknown models', async () => {
		expect(await getTokenLimit('unknown-model')).toBe(8192);
	});

	it('should truncate messages when exceeding token limit', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		// Add a very long message (approx 10000 tokens)
		const longMessage = 'x'.repeat(40000);
		addMessageToContext('chat', 'user', longMessage);
		addMessageToContext('chat', 'assistant', 'Short response');
		
		selectContext('chat');
		const context = await getContext();
		
		// Should have truncated to stay under limit
		expect(context!.messages.length).toBeLessThan(2);
	});

	it('should call warning callback when truncation occurs', async () => {
		const warnings: string[] = [];
		setWarningCallback((msg) => warnings.push(msg));
		
		setModelId('gpt-4');
		const longMessage = 'x'.repeat(40000);
		addMessageToContext('chat', 'user', longMessage);
		addMessageToContext('chat', 'assistant', 'Response');
		
		selectContext('chat');
		await getContext();
		
		expect(warnings.length).toBeGreaterThan(0);
		expect(warnings[0]).toContain('exceeded token limit');
	});
});

describe('model ID management', () => {
	beforeEach(() => {
		resetState();
	});

	it('should set and get model ID', () => {
		expect(getModelId()).toBeUndefined();
		
		setModelId('gpt-4o');
		expect(getModelId()).toBe('gpt-4o');
		
		setModelId('claude-3');
		expect(getModelId()).toBe('claude-3');
	});

	it('should allow setting model ID to undefined', () => {
		setModelId('gpt-4o');
		expect(getModelId()).toBe('gpt-4o');
		
		setModelId(undefined);
		expect(getModelId()).toBeUndefined();
	});

	it('should reset model ID on resetState', () => {
		setModelId('gpt-4o');
		resetState();
		expect(getModelId()).toBeUndefined();
	});
});

describe('warning callback management', () => {
	beforeEach(() => {
		resetState();
	});

	it('should set and use warning callback', async () => {
		const warnings: string[] = [];
		setWarningCallback((msg) => warnings.push(msg));
		
		setModelId('gpt-4');
		const longMessage = 'x'.repeat(40000);
		addMessageToContext('chat', 'user', longMessage);
		addMessageToContext('chat', 'assistant', 'Response');
		
		selectContext('chat');
		await getContext();
		
		expect(warnings.length).toBeGreaterThan(0);
	});

	it('should reset warning callback on resetState', async () => {
		const warnings: string[] = [];
		setWarningCallback((msg) => warnings.push(msg));
		
		resetState();
		
		// Add data that would trigger warning
		setModelId('gpt-4');
		const longMessage = 'x'.repeat(40000);
		addMessageToContext('chat', 'user', longMessage);
		selectContext('chat');
		await getContext();
		
		// Callback should not be called after reset
		expect(warnings).toHaveLength(0);
	});
});
