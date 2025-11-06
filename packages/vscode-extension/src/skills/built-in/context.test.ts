/**
 * Module: skills/built-in/context.test.ts
 *
 * Description:
 *   Unit tests for the context skill and context management API.
 *   Tests context selection, message tracking, and API functions.
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
		// Reset all context state before each test
		resetState();
		// Create a fresh mock API for each test
		mockApi = createMockSkillApi();
	});

	describe('metadata', () => {
		it('should have correct name', async () => {
			expect(contextSkill.name).toBe('context');
		});

		it('should have description', async () => {
			expect(contextSkill.description).toBeTruthy();
			expect(typeof contextSkill.description).toBe('string');
		});

		it('should have execute function', async () => {
			expect(typeof contextSkill.execute).toBe('function');
		});
	});

	describe('single context selection', () => {
		it('should select a single context by name', async () => {
			const result = await contextSkill.execute(mockApi, { name: 'research' });
			
			expect(result.messages).toHaveLength(1);
			expect(result.messages[0].role).toBe('agent');
			expect(result.messages[0].content).toBe('Context set to: research');
			expect(contextNames()).toEqual(['research']);
		});

		it('should create context if it does not exist', async () => {
			await contextSkill.execute(mockApi, { name: 'new-context' });
			
			const contexts = await getContext();
			expect(contexts).toHaveLength(1);
			expect(contexts[0].name).toBe('new-context');
			// Context now has the confirmation message
			expect(contexts[0].messages).toEqual([
				{ role: 'agent', content: 'Context set to: new-context' }
			]);
		});

		it('should switch to existing context', async () => {
			// Create and select first context
			await contextSkill.execute(mockApi, { name: 'context1' });
			addMessageToContext('context1', 'user', 'Hello');
			
			// Switch to another context
			await contextSkill.execute(mockApi, { name: 'context2' });
			expect(contextNames()).toEqual(['context2']);
			
			// Switch back to first context
			await contextSkill.execute(mockApi, { name: 'context1' });
			expect(contextNames()).toEqual(['context1']);
			
			// Verify context1 still has its messages
			const contexts = await getContext();
			// context1 has: first confirmation + user message + second confirmation
			expect(contexts[0].messages).toHaveLength(3);
			expect(contexts[0].messages[0].content).toBe('Context set to: context1');
			expect(contexts[0].messages[1].content).toBe('Hello');
			expect(contexts[0].messages[2].content).toBe('Context set to: context1');
		});

		it('should trim whitespace from context name', async () => {
			const result = await contextSkill.execute(mockApi, { name: '  research  ' });
			
			expect(contextNames()).toEqual(['research']);
			expect(result.messages[0].content).toBe('Context set to: research');
		});
	});

	describe('multiple context selection', () => {
		it('should select multiple contexts by names', async () => {
			const result = await contextSkill.execute(mockApi, { names: 'research,summary,notes' });
			
			expect(result.messages).toHaveLength(1);
			expect(result.messages[0].role).toBe('agent');
			expect(result.messages[0].content).toBe('Contexts selected: research, summary, notes');
			expect(contextNames()).toEqual(['research', 'summary', 'notes']);
		});

		it('should create all contexts if they do not exist', async () => {
			await contextSkill.execute(mockApi, { names: 'ctx1,ctx2,ctx3' });
			
			const contexts = await getContext();
			expect(contexts).toHaveLength(3);
			expect(contexts[0].name).toBe('ctx1');
			expect(contexts[1].name).toBe('ctx2');
			expect(contexts[2].name).toBe('ctx3');
		});

		it('should trim whitespace from all context names', async () => {
			await contextSkill.execute(mockApi, { names: ' context1 , context2 , context3 ' });
			
			expect(contextNames()).toEqual(['context1', 'context2', 'context3']);
		});

		it('should handle comma-separated names with mixed existing and new contexts', async () => {
			// Create one context
			await contextSkill.execute(mockApi, { name: 'existing' });
			addMessageToContext('existing', 'user', 'Test message');
			
			// Select multiple including the existing one
			await contextSkill.execute(mockApi, { names: 'existing,new1,new2' });
			
			const contexts = await getContext();
			expect(contexts).toHaveLength(3);
			// existing context: confirmation from first execute + test message + confirmation from second execute
			expect(contexts[0].messages).toHaveLength(3);
			// new contexts: only confirmation message from second execute
			expect(contexts[1].messages).toHaveLength(1);
			expect(contexts[2].messages).toHaveLength(1);
		});
	});

	describe('error handling', () => {
		it('should throw error if no name or names provided', async () => {
			await expect(contextSkill.execute(mockApi, {})).rejects.toThrow('Missing context name(s)');
		});

		it('should throw error if name is undefined', async () => {
			await expect(contextSkill.execute(mockApi, { name: undefined })).rejects.toThrow('Missing context name(s)');
		});

		it('should throw error if name is empty string', async () => {
			await expect(contextSkill.execute(mockApi, { name: '' })).rejects.toThrow('Invalid context name: empty string');
		});

		it('should throw error if name is only whitespace', async () => {
			await expect(contextSkill.execute(mockApi, { name: '   ' })).rejects.toThrow('Invalid context name: empty string');
		});

		it('should throw error if names is empty string', async () => {
			await expect(contextSkill.execute(mockApi, { names: '' })).rejects.toThrow('Missing or invalid context name(s)');
		});

		it('should throw error if names contains only whitespace and commas', async () => {
			await expect(contextSkill.execute(mockApi, { names: ' , , ' })).rejects.toThrow('Missing or invalid context name(s)');
		});

		it('should filter out empty names in comma-separated list', async () => {
			const result = await contextSkill.execute(mockApi, { names: 'valid,  ,another' });
			
			// Empty entries should be filtered out
			expect(contextNames()).toEqual(['valid', 'another']);
			expect(result.messages[0].content).toBe('Contexts selected: valid, another');
		});
	});
});

describe('contextNames API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should return empty array initially', async () => {
		expect(contextNames()).toEqual([]);
	});

	it('should return selected context names', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { names: 'ctx1,ctx2' });
		
		expect(contextNames()).toEqual(['ctx1', 'ctx2']);
	});

	it('should return a copy of the array (not reference)', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { name: 'test' });
		
		const names1 = contextNames();
		const names2 = contextNames();
		
		expect(names1).toEqual(names2);
		expect(names1).not.toBe(names2); // Different array instances
	});
});

describe('getContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should return empty array initially', async () => {
		expect(await getContext()).toEqual([]);
	});

	it('should return all selected contexts with messages', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { names: 'ctx1,ctx2' });
		
		addMessageToContext('ctx1', 'user', 'Hello');
		addMessageToContext('ctx2', 'assistant', 'Hi there');
		
		const contexts = await getContext();
		expect(contexts).toHaveLength(2);
		expect(contexts[0]).toEqual({
			name: 'ctx1',
			messages: [
				{ role: 'agent', content: 'Contexts selected: ctx1, ctx2' },
				{ role: 'user', content: 'Hello' }
			]
		});
		expect(contexts[1]).toEqual({
			name: 'ctx2',
			messages: [
				{ role: 'agent', content: 'Contexts selected: ctx1, ctx2' },
				{ role: 'assistant', content: 'Hi there' }
			]
		});
	});

	it('should return contexts in the order they were selected', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { names: 'third,first,second' });
		
		const contexts = await getContext();
		expect(contexts.map(c => c.name)).toEqual(['third', 'first', 'second']);
	});
});

describe('selectContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should select contexts programmatically', async () => {
		selectContext(['api-ctx1', 'api-ctx2']);
		
		expect(contextNames()).toEqual(['api-ctx1', 'api-ctx2']);
	});

	it('should create contexts if they do not exist', async () => {
		selectContext(['new1', 'new2']);
		
		const contexts = await getContext();
		expect(contexts).toHaveLength(2);
		expect(contexts[0].name).toBe('new1');
		expect(contexts[1].name).toBe('new2');
	});

	it('should throw error if names array is empty', async () => {
		expect(() => selectContext([])).toThrow('Missing or invalid context names');
	});

	it('should throw error if names is not an array', async () => {
		// @ts-expect-error Testing invalid input
		expect(() => selectContext('not-array')).toThrow('Missing or invalid context names');
	});

	it('should throw error if names contains non-string', async () => {
		// @ts-expect-error Testing invalid input
		expect(() => selectContext(['valid', 123, 'another'])).toThrow('Invalid context name: must be non-empty string');
	});

	it('should throw error if names contains empty string', async () => {
		expect(() => selectContext(['valid', '', 'another'])).toThrow('Invalid context name: must be non-empty string');
	});

	it('should throw error if names contains whitespace-only string', async () => {
		expect(() => selectContext(['valid', '   ', 'another'])).toThrow('Invalid context name: must be non-empty string');
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
		
		const contexts = await getContext();
		expect(contexts[0].messages).toHaveLength(3); // confirmation + 2 added messages
		expect(contexts[0].messages[0]).toEqual({ role: 'agent', content: 'Context set to: test' });
		expect(contexts[0].messages[1]).toEqual({ role: 'user', content: 'Hello' });
		expect(contexts[0].messages[2]).toEqual({ role: 'assistant', content: 'Hi there' });
	});

	it('should create context if it does not exist', async () => {
		addMessageToContext('new-context', 'user', 'First message');
		
		// Select the context to retrieve it
		selectContext(['new-context']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(1);
		expect(contexts[0].messages[0]).toEqual({ role: 'user', content: 'First message' });
	});

	it('should preserve message order (chronological)', async () => {
		addMessageToContext('chat', 'user', 'Message 1');
		addMessageToContext('chat', 'assistant', 'Message 2');
		addMessageToContext('chat', 'user', 'Message 3');
		addMessageToContext('chat', 'assistant', 'Message 4');
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(4);
		expect(contexts[0].messages[0].content).toBe('Message 1');
		expect(contexts[0].messages[1].content).toBe('Message 2');
		expect(contexts[0].messages[2].content).toBe('Message 3');
		expect(contexts[0].messages[3].content).toBe('Message 4');
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
		
		// Select both contexts
		selectContext(['ctx1', 'ctx2']);
		const contexts = await getContext();
		
		expect(contexts).toHaveLength(2);
		// ctx1 has: confirmation from execute + user message
		expect(contexts[0].messages[0].content).toBe('Context set to: ctx1');
		expect(contexts[0].messages[1].content).toBe('Context 1 message');
		// ctx2 has: confirmation from execute + user message
		expect(contexts[1].messages[0].content).toBe('Context set to: ctx2');
		expect(contexts[1].messages[1].content).toBe('Context 2 message');
	});
});

describe('appendContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should append messages to existing context', async () => {
		addMessageToContext('chat', 'user', 'Message 1');
		
		const newMessages = [
			{ role: 'assistant' as const, content: 'Message 2' },
			{ role: 'user' as const, content: 'Message 3' }
		];
		appendContext('chat', newMessages);
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(3);
		expect(contexts[0].messages[0].content).toBe('Message 1');
		expect(contexts[0].messages[1].content).toBe('Message 2');
		expect(contexts[0].messages[2].content).toBe('Message 3');
	});

	it('should append to empty context', async () => {
		const messages = [
			{ role: 'user' as const, content: 'First' },
			{ role: 'assistant' as const, content: 'Second' }
		];
		appendContext('new-context', messages);
		
		selectContext(['new-context']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(2);
		expect(contexts[0].messages).toEqual(messages);
	});

	it('should create context if it does not exist', async () => {
		const messages = [
			{ role: 'user' as const, content: 'Test message' }
		];
		appendContext('nonexistent', messages);
		
		selectContext(['nonexistent']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toEqual(messages);
	});

	it('should preserve existing messages when appending', async () => {
		addMessageToContext('chat', 'user', 'Existing 1');
		addMessageToContext('chat', 'assistant', 'Existing 2');
		
		appendContext('chat', [
			{ role: 'user', content: 'New 1' },
			{ role: 'assistant', content: 'New 2' }
		]);
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(4);
		expect(contexts[0].messages.map(m => m.content)).toEqual([
			'Existing 1',
			'Existing 2',
			'New 1',
			'New 2'
		]);
	});

	it('should append empty message array without error', async () => {
		addMessageToContext('chat', 'user', 'Message');
		appendContext('chat', []);
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(1);
	});

	it('should maintain message order when appending', async () => {
		const batch1 = [
			{ role: 'user' as const, content: '1' },
			{ role: 'assistant' as const, content: '2' }
		];
		const batch2 = [
			{ role: 'user' as const, content: '3' },
			{ role: 'assistant' as const, content: '4' }
		];
		
		appendContext('chat', batch1);
		appendContext('chat', batch2);
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		expect(contexts[0].messages.map(m => m.content)).toEqual(['1', '2', '3', '4']);
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
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(2);
		expect(contexts[0].messages).toEqual(newMessages);
	});

	it('should clear context when setting empty array', async () => {
		addMessageToContext('chat', 'user', 'Message 1');
		addMessageToContext('chat', 'assistant', 'Message 2');
		addMessageToContext('chat', 'user', 'Message 3');
		
		setContext('chat', []);
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(0);
	});

	it('should set messages in new context', async () => {
		const messages = [
			{ role: 'user' as const, content: 'Hello' },
			{ role: 'assistant' as const, content: 'Hi there' }
		];
		setContext('new-context', messages);
		
		selectContext(['new-context']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toEqual(messages);
	});

	it('should replace messages entirely (not append)', async () => {
		addMessageToContext('chat', 'user', 'Old 1');
		addMessageToContext('chat', 'assistant', 'Old 2');
		addMessageToContext('chat', 'user', 'Old 3');
		
		setContext('chat', [
			{ role: 'assistant' as const, content: 'Brand new' }
		]);
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toHaveLength(1);
		expect(contexts[0].messages[0].content).toBe('Brand new');
	});

	it('should create context if it does not exist', async () => {
		const messages = [
			{ role: 'user' as const, content: 'Test' }
		];
		setContext('nonexistent', messages);
		
		selectContext(['nonexistent']);
		const contexts = await getContext();
		
		expect(contexts[0].messages).toEqual(messages);
	});

	it('should create independent copy of messages', async () => {
		const originalMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
			{ role: 'user', content: 'Original' }
		];
		setContext('chat', originalMessages);
		
		// Modify the original array
		originalMessages.push({ role: 'assistant', content: 'Appended' });
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		// The context should not be affected by changes to the original array
		expect(contexts[0].messages).toHaveLength(1);
		expect(contexts[0].messages[0].content).toBe('Original');
	});

	it('should handle multiple set operations on same context', async () => {
		const msg1 = [{ role: 'user' as const, content: 'First set' }];
		const msg2 = [
			{ role: 'user' as const, content: 'Second set 1' },
			{ role: 'assistant' as const, content: 'Second set 2' }
		];
		const msg3 = [{ role: 'assistant' as const, content: 'Third set' }];
		
		setContext('chat', msg1);
		selectContext(['chat']);
		let contexts = await getContext();
		expect(contexts[0].messages).toHaveLength(1);
		
		setContext('chat', msg2);
		selectContext(['chat']);
		contexts = await getContext();
		expect(contexts[0].messages).toHaveLength(2);
		
		setContext('chat', msg3);
		selectContext(['chat']);
		contexts = await getContext();
		expect(contexts[0].messages).toHaveLength(1);
		expect(contexts[0].messages[0].content).toBe('Third set');
	});
});

describe('duplicate context names validation', () => {
	beforeEach(() => {
		resetState();
	});

	it('should throw error on duplicate context names in skill execution', async () => {
		const mockApi = createMockSkillApi();
		await expect(
			contextSkill.execute(mockApi, { names: 'ctx1,ctx2,ctx1' })
		).rejects.toThrow('Duplicate context names are not allowed');
	});

	it('should throw error on duplicate context names in selectContext API', async () => {
		expect(() => selectContext(['ctx1', 'ctx2', 'ctx1'])).toThrow('Duplicate context names are not allowed');
	});

	it('should allow same context name if called separately', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { name: 'ctx1' });
		await contextSkill.execute(mockApi, { name: 'ctx1' }); // Should not throw
		
		expect(contextNames()).toEqual(['ctx1']);
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
		expect(await getTokenLimit('claude-3-haiku')).toBe(200000);
		expect(await getTokenLimit('claude-3.5')).toBe(200000);
		expect(await getTokenLimit('claude-3.5-sonnet')).toBe(200000);
	});

	it('should return default token limit for unknown model', async () => {
		expect(await getTokenLimit('unknown-model')).toBe(8192);
	});

	it('should return current model token limit when no model specified', async () => {
		setModelId('gpt-4o');
		expect(await getTokenLimit()).toBe(128000);
	});

	it('should return default limit when no model is set', async () => {
		expect(await getTokenLimit()).toBe(8192);
	});

	it('should truncate context when exceeding token limit', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		// Add messages that exceed the limit
		// Each character is ~0.25 tokens, so 40000 chars = ~10000 tokens
		const longMessage = 'x'.repeat(40000);
		addMessageToContext('chat', 'user', longMessage);
		addMessageToContext('chat', 'assistant', 'Short response');
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		// First message should be truncated
		expect(contexts[0].messages).toHaveLength(1);
		expect(contexts[0].messages[0].content).toBe('Short response');
	});

	it('should keep messages under token limit intact', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		// Add messages well under the limit
		addMessageToContext('chat', 'user', 'Hello');
		addMessageToContext('chat', 'assistant', 'Hi there');
		addMessageToContext('chat', 'user', 'How are you?');
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		// All messages should be preserved
		expect(contexts[0].messages).toHaveLength(3);
		expect(contexts[0].messages[0].content).toBe('Hello');
		expect(contexts[0].messages[1].content).toBe('Hi there');
		expect(contexts[0].messages[2].content).toBe('How are you?');
	});

	it('should truncate oldest messages first (FIFO)', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		// Add 5 messages, each ~3000 tokens (12000 chars)
		const msg = 'x'.repeat(12000);
		addMessageToContext('chat', 'user', msg + '1');
		addMessageToContext('chat', 'assistant', msg + '2');
		addMessageToContext('chat', 'user', msg + '3');
		addMessageToContext('chat', 'assistant', msg + '4');
		addMessageToContext('chat', 'user', msg + '5');
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		// Should keep only the last 2-3 messages to stay under 8192 tokens
		// First messages (1, 2, 3) should be removed, keeping newer ones
		const contents = contexts[0].messages.map(m => m.content);
		expect(contents.every(c => c.endsWith('4') || c.endsWith('5'))).toBe(true);
	});

	it('should call warning callback when truncation occurs', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		const warnings: string[] = [];
		setWarningCallback((msg) => warnings.push(msg));
		
		// Add messages that exceed the limit
		const longMessage = 'x'.repeat(40000);
		addMessageToContext('chat', 'user', longMessage);
		addMessageToContext('chat', 'assistant', 'Short response');
		
		selectContext(['chat']);
		await getContext(); // Trigger truncation
		
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain('Context "chat" exceeded token limit');
		expect(warnings[0]).toContain('for model gpt-4');
		expect(warnings[0]).toContain('8192 tokens');
		expect(warnings[0]).toContain('Removed 1 oldest message');
	});

	it('should handle warning callback for multiple messages removed', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		const warnings: string[] = [];
		setWarningCallback((msg) => warnings.push(msg));
		
		// Add many messages that exceed the limit
		const msg = 'x'.repeat(12000);
		for (let i = 0; i < 5; i++) {
			addMessageToContext('chat', 'user', msg);
		}
		
		selectContext(['chat']);
		await getContext(); // Trigger truncation
		
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain('Removed');
		expect(warnings[0]).toContain('oldest messages'); // plural
	});

	it('should not call warning callback when no truncation occurs', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		const warnings: string[] = [];
		setWarningCallback((msg) => warnings.push(msg));
		
		// Add small messages
		addMessageToContext('chat', 'user', 'Hello');
		addMessageToContext('chat', 'assistant', 'Hi');
		
		selectContext(['chat']);
		getContext();
		
		expect(warnings).toHaveLength(0);
	});

	it('should allow empty context after complete truncation', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		// Add single massive message that exceeds limit
		const hugeMessage = 'x'.repeat(100000); // Way over limit
		addMessageToContext('chat', 'user', hugeMessage);
		
		selectContext(['chat']);
		const contexts = await getContext();
		
		// Should truncate completely, leaving empty context
		expect(contexts[0].messages).toHaveLength(0);
	});

	it('should handle multiple contexts independently for truncation', async () => {
		setModelId('gpt-4'); // 8192 token limit
		
		// Context 1: exceeds limit
		const longMessage = 'x'.repeat(40000);
		addMessageToContext('ctx1', 'user', longMessage);
		addMessageToContext('ctx1', 'assistant', 'Response');
		
		// Context 2: under limit
		addMessageToContext('ctx2', 'user', 'Hello');
		addMessageToContext('ctx2', 'assistant', 'Hi');
		
		selectContext(['ctx1', 'ctx2']);
		const contexts = await getContext();
		
		// ctx1 should be truncated, ctx2 should not
		expect(contexts[0].messages).toHaveLength(1); // Truncated
		expect(contexts[1].messages).toHaveLength(2); // Preserved
	});
});

describe('model ID management', () => {
	beforeEach(() => {
		resetState();
	});

	it('should set and get model ID', async () => {
		expect(getModelId()).toBeUndefined();
		
		setModelId('gpt-4o');
		expect(getModelId()).toBe('gpt-4o');
		
		setModelId('claude-3');
		expect(getModelId()).toBe('claude-3');
	});

	it('should allow setting model ID to undefined', async () => {
		setModelId('gpt-4o');
		expect(getModelId()).toBe('gpt-4o');
		
		setModelId(undefined);
		expect(getModelId()).toBeUndefined();
	});

	it('should reset model ID on resetState', async () => {
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
		
		selectContext(['chat']);
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
		selectContext(['chat']);
		await getContext();
		
		// Callback should not be called after reset
		expect(warnings).toHaveLength(0);
	});
});
