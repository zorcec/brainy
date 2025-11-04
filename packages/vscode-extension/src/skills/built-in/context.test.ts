/**
 * Module: skills/built-in/context.test.ts
 *
 * Description:
 *   Unit tests for the context skill and context management API.
 *   Tests context selection, message tracking, and API functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
	contextSkill, 
	contextNames, 
	getContext, 
	selectContext, 
	addMessageToContext,
	appendContext,
	setContext,
	resetState 
} from './context';
import { createMockSkillApi } from '../testUtils';

describe('contextSkill', () => {
	let mockApi: ReturnType<typeof createMockSkillApi>;

	beforeEach(() => {
		// Reset all context state before each test
		resetState();
		// Create a fresh mock API for each test
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
			expect(contextNames()).toEqual(['research']);
		});

		it('should create context if it does not exist', async () => {
			await contextSkill.execute(mockApi, { name: 'new-context' });
			
			const contexts = getContext();
			expect(contexts).toHaveLength(1);
			expect(contexts[0].name).toBe('new-context');
			expect(contexts[0].messages).toEqual([]);
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
			const contexts = getContext();
			expect(contexts[0].messages).toHaveLength(1);
			expect(contexts[0].messages[0].content).toBe('Hello');
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
			
			const contexts = getContext();
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
			
			const contexts = getContext();
			expect(contexts).toHaveLength(3);
			expect(contexts[0].messages).toHaveLength(1); // existing context preserved
			expect(contexts[1].messages).toHaveLength(0); // new contexts empty
			expect(contexts[2].messages).toHaveLength(0);
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

	it('should return empty array initially', () => {
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

	it('should return empty array initially', () => {
		expect(getContext()).toEqual([]);
	});

	it('should return all selected contexts with messages', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { names: 'ctx1,ctx2' });
		
		addMessageToContext('ctx1', 'user', 'Hello');
		addMessageToContext('ctx2', 'assistant', 'Hi there');
		
		const contexts = getContext();
		expect(contexts).toHaveLength(2);
		expect(contexts[0]).toEqual({
			name: 'ctx1',
			messages: [{ role: 'user', content: 'Hello' }]
		});
		expect(contexts[1]).toEqual({
			name: 'ctx2',
			messages: [{ role: 'assistant', content: 'Hi there' }]
		});
	});

	it('should return contexts in the order they were selected', async () => {
		const mockApi = createMockSkillApi();
		await contextSkill.execute(mockApi, { names: 'third,first,second' });
		
		const contexts = getContext();
		expect(contexts.map(c => c.name)).toEqual(['third', 'first', 'second']);
	});
});

describe('selectContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should select contexts programmatically', () => {
		selectContext(['api-ctx1', 'api-ctx2']);
		
		expect(contextNames()).toEqual(['api-ctx1', 'api-ctx2']);
	});

	it('should create contexts if they do not exist', () => {
		selectContext(['new1', 'new2']);
		
		const contexts = getContext();
		expect(contexts).toHaveLength(2);
		expect(contexts[0].name).toBe('new1');
		expect(contexts[1].name).toBe('new2');
	});

	it('should throw error if names array is empty', () => {
		expect(() => selectContext([])).toThrow('Missing or invalid context names');
	});

	it('should throw error if names is not an array', () => {
		// @ts-expect-error Testing invalid input
		expect(() => selectContext('not-array')).toThrow('Missing or invalid context names');
	});

	it('should throw error if names contains non-string', () => {
		// @ts-expect-error Testing invalid input
		expect(() => selectContext(['valid', 123, 'another'])).toThrow('Invalid context name: must be non-empty string');
	});

	it('should throw error if names contains empty string', () => {
		expect(() => selectContext(['valid', '', 'another'])).toThrow('Invalid context name: must be non-empty string');
	});

	it('should throw error if names contains whitespace-only string', () => {
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
		
		const contexts = getContext();
		expect(contexts[0].messages).toHaveLength(2);
		expect(contexts[0].messages[0]).toEqual({ role: 'user', content: 'Hello' });
		expect(contexts[0].messages[1]).toEqual({ role: 'assistant', content: 'Hi there' });
	});

	it('should create context if it does not exist', () => {
		addMessageToContext('new-context', 'user', 'First message');
		
		// Select the context to retrieve it
		selectContext(['new-context']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toHaveLength(1);
		expect(contexts[0].messages[0]).toEqual({ role: 'user', content: 'First message' });
	});

	it('should preserve message order (chronological)', () => {
		addMessageToContext('chat', 'user', 'Message 1');
		addMessageToContext('chat', 'assistant', 'Message 2');
		addMessageToContext('chat', 'user', 'Message 3');
		addMessageToContext('chat', 'assistant', 'Message 4');
		
		selectContext(['chat']);
		const contexts = getContext();
		
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
		const contexts = getContext();
		
		expect(contexts).toHaveLength(2);
		expect(contexts[0].messages[0].content).toBe('Context 1 message');
		expect(contexts[1].messages[0].content).toBe('Context 2 message');
	});
});

describe('appendContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should append messages to existing context', () => {
		addMessageToContext('chat', 'user', 'Message 1');
		
		const newMessages = [
			{ role: 'assistant' as const, content: 'Message 2' },
			{ role: 'user' as const, content: 'Message 3' }
		];
		appendContext('chat', newMessages);
		
		selectContext(['chat']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toHaveLength(3);
		expect(contexts[0].messages[0].content).toBe('Message 1');
		expect(contexts[0].messages[1].content).toBe('Message 2');
		expect(contexts[0].messages[2].content).toBe('Message 3');
	});

	it('should append to empty context', () => {
		const messages = [
			{ role: 'user' as const, content: 'First' },
			{ role: 'assistant' as const, content: 'Second' }
		];
		appendContext('new-context', messages);
		
		selectContext(['new-context']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toHaveLength(2);
		expect(contexts[0].messages).toEqual(messages);
	});

	it('should create context if it does not exist', () => {
		const messages = [
			{ role: 'user' as const, content: 'Test message' }
		];
		appendContext('nonexistent', messages);
		
		selectContext(['nonexistent']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toEqual(messages);
	});

	it('should preserve existing messages when appending', () => {
		addMessageToContext('chat', 'user', 'Existing 1');
		addMessageToContext('chat', 'assistant', 'Existing 2');
		
		appendContext('chat', [
			{ role: 'user', content: 'New 1' },
			{ role: 'assistant', content: 'New 2' }
		]);
		
		selectContext(['chat']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toHaveLength(4);
		expect(contexts[0].messages.map(m => m.content)).toEqual([
			'Existing 1',
			'Existing 2',
			'New 1',
			'New 2'
		]);
	});

	it('should append empty message array without error', () => {
		addMessageToContext('chat', 'user', 'Message');
		appendContext('chat', []);
		
		selectContext(['chat']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toHaveLength(1);
	});

	it('should maintain message order when appending', () => {
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
		const contexts = getContext();
		
		expect(contexts[0].messages.map(m => m.content)).toEqual(['1', '2', '3', '4']);
	});
});

describe('setContext API', () => {
	beforeEach(() => {
		resetState();
	});

	it('should replace all messages in existing context', () => {
		addMessageToContext('chat', 'user', 'Old message 1');
		addMessageToContext('chat', 'assistant', 'Old message 2');
		
		const newMessages = [
			{ role: 'user' as const, content: 'New message 1' },
			{ role: 'assistant' as const, content: 'New message 2' }
		];
		setContext('chat', newMessages);
		
		selectContext(['chat']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toHaveLength(2);
		expect(contexts[0].messages).toEqual(newMessages);
	});

	it('should clear context when setting empty array', () => {
		addMessageToContext('chat', 'user', 'Message 1');
		addMessageToContext('chat', 'assistant', 'Message 2');
		addMessageToContext('chat', 'user', 'Message 3');
		
		setContext('chat', []);
		
		selectContext(['chat']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toHaveLength(0);
	});

	it('should set messages in new context', () => {
		const messages = [
			{ role: 'user' as const, content: 'Hello' },
			{ role: 'assistant' as const, content: 'Hi there' }
		];
		setContext('new-context', messages);
		
		selectContext(['new-context']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toEqual(messages);
	});

	it('should replace messages entirely (not append)', () => {
		addMessageToContext('chat', 'user', 'Old 1');
		addMessageToContext('chat', 'assistant', 'Old 2');
		addMessageToContext('chat', 'user', 'Old 3');
		
		setContext('chat', [
			{ role: 'assistant' as const, content: 'Brand new' }
		]);
		
		selectContext(['chat']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toHaveLength(1);
		expect(contexts[0].messages[0].content).toBe('Brand new');
	});

	it('should create context if it does not exist', () => {
		const messages = [
			{ role: 'user' as const, content: 'Test' }
		];
		setContext('nonexistent', messages);
		
		selectContext(['nonexistent']);
		const contexts = getContext();
		
		expect(contexts[0].messages).toEqual(messages);
	});

	it('should create independent copy of messages', () => {
		const originalMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
			{ role: 'user', content: 'Original' }
		];
		setContext('chat', originalMessages);
		
		// Modify the original array
		originalMessages.push({ role: 'assistant', content: 'Appended' });
		
		selectContext(['chat']);
		const contexts = getContext();
		
		// The context should not be affected by changes to the original array
		expect(contexts[0].messages).toHaveLength(1);
		expect(contexts[0].messages[0].content).toBe('Original');
	});

	it('should handle multiple set operations on same context', () => {
		const msg1 = [{ role: 'user' as const, content: 'First set' }];
		const msg2 = [
			{ role: 'user' as const, content: 'Second set 1' },
			{ role: 'assistant' as const, content: 'Second set 2' }
		];
		const msg3 = [{ role: 'assistant' as const, content: 'Third set' }];
		
		setContext('chat', msg1);
		selectContext(['chat']);
		expect(getContext()[0].messages).toHaveLength(1);
		
		setContext('chat', msg2);
		selectContext(['chat']);
		expect(getContext()[0].messages).toHaveLength(2);
		
		setContext('chat', msg3);
		selectContext(['chat']);
		expect(getContext()[0].messages).toHaveLength(1);
		expect(getContext()[0].messages[0].content).toBe('Third set');
	});
});
