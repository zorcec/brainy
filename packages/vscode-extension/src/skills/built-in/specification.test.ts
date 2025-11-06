/**
 * Tests for the specification skill.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { specificationSkill } from './specification';
import { createMockSkillApi } from '../testUtils';
import type { SkillApi } from '../types';

describe('specification skill', () => {
	let mockApi: SkillApi;

	beforeEach(() => {
		mockApi = createMockSkillApi();
	});

	it('should have correct name and description', () => {
		expect(specificationSkill.name).toBe('specification');
		expect(specificationSkill.description).toBeTruthy();
		expect(specificationSkill.description).toContain('document');
	});

	it('should have correct parameters', () => {
		expect(specificationSkill.params).toBeDefined();
		expect(specificationSkill.params).toHaveLength(2);
		
		const paramNames = specificationSkill.params?.map(p => p.name);
		expect(paramNames).toContain('variable');
		expect(paramNames).toContain('content');
	});

	it('should open document, add to context, and store content in variable if specified', async () => {
		const documentContent = '# Test Specification\n\nThis is a test.';
		mockApi.openTextDocument = vi.fn(async () => documentContent);
		mockApi.setVariable = vi.fn();
		mockApi.addToContext = vi.fn();

		const result = await specificationSkill.execute(mockApi, {
			variable: 'mySpec'
		});

		expect(mockApi.openTextDocument).toHaveBeenCalledWith(undefined, 'markdown');
		expect(mockApi.setVariable).toHaveBeenCalledWith('mySpec', documentContent);
		expect(mockApi.addToContext).toHaveBeenCalledWith('assistant', documentContent);
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('agent');
		expect(result.messages[0].content).toContain('mySpec');
		expect(result.messages[0].content).toContain('context');
	});

	it('should prefill document with content flag and add to context', async () => {
		const initialContent = '# Initial Content\n\nEdit this...';
		const finalContent = '# Final Content\n\nEdited!';

		mockApi.openTextDocument = vi.fn(async (content, language) => {
			expect(content).toBe(initialContent);
			expect(language).toBe('markdown');
			return finalContent;
		});
		mockApi.setVariable = vi.fn();
		mockApi.addToContext = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'spec',
			content: initialContent
		});

		expect(mockApi.openTextDocument).toHaveBeenCalledWith(initialContent, 'markdown');
		expect(mockApi.setVariable).toHaveBeenCalledWith('spec', finalContent);
		expect(mockApi.addToContext).toHaveBeenCalledWith('assistant', finalContent);
	});

	it('should add content to context if no variable is specified', async () => {
		const documentContent = '# Context Content\n\nThis goes to context.';
		mockApi.openTextDocument = vi.fn(async () => documentContent);
		mockApi.addToContext = vi.fn();

		const result = await specificationSkill.execute(mockApi, {});

		expect(mockApi.addToContext).toHaveBeenCalledWith('assistant', documentContent);
		expect(result.messages[0].content).toContain('context');
	});

	// No longer throws if neither variable nor context is specified

	// No longer throws if both variable and context are specified (context flag removed)

	it('should throw error if variable is empty string', async () => {
		await expect(specificationSkill.execute(mockApi, {
			variable: ''
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if variable is whitespace only', async () => {
		await expect(specificationSkill.execute(mockApi, {
			variable: '   '
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if variable is not a string', async () => {
		await expect(specificationSkill.execute(mockApi, {
			variable: 123 as any
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should handle user cancellation', async () => {
		mockApi.openTextDocument = vi.fn(async () => {
			throw new Error('User cancelled document editing');
		});

		await expect(specificationSkill.execute(mockApi, {
			variable: 'spec'
		})).rejects.toThrow('User cancelled document editing');
	});

	it('should handle empty document content', async () => {
		mockApi.openTextDocument = vi.fn(async () => '');
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'emptySpec'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('emptySpec', '');
	});

	it('should handle large document content', async () => {
		const largeContent = 'x'.repeat(100000);
		mockApi.openTextDocument = vi.fn(async () => largeContent);
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'largeSpec'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('largeSpec', largeContent);
	});

	it('should handle content with special characters', async () => {
		const specialContent = '# Title\n\n```typescript\nconst x = "test";\n```\n\n**bold** *italic*';
		mockApi.openTextDocument = vi.fn(async () => specialContent);
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'spec'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('spec', specialContent);
	});

	it('should handle multiline content', async () => {
		const multilineContent = 'Line 1\nLine 2\nLine 3\n\nLine 5';
		mockApi.openTextDocument = vi.fn(async () => multilineContent);
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'multiline'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('multiline', multilineContent);
	});

	it('should handle content with unicode characters', async () => {
		const unicodeContent = 'Hello 世界 🌍 café';
		mockApi.openTextDocument = vi.fn(async () => unicodeContent);
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'unicode'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('unicode', unicodeContent);
	});

	it('should pass through content parameter correctly', async () => {
		const initialContent = 'Initial text';
		mockApi.openTextDocument = vi.fn(async (content) => content || 'default');
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'spec',
			content: initialContent
		});

		expect(mockApi.openTextDocument).toHaveBeenCalledWith(initialContent, 'markdown');
	});

	it('should handle undefined content parameter', async () => {
		mockApi.openTextDocument = vi.fn(async (content) => {
			expect(content).toBeUndefined();
			return 'user input';
		});
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'spec'
		});

		expect(mockApi.openTextDocument).toHaveBeenCalledWith(undefined, 'markdown');
	});

	it('should not call setVariable when using context flag', async () => {
		mockApi.openTextDocument = vi.fn(async () => 'content');
		mockApi.addToContext = vi.fn();
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			context: 'true'
		});

		expect(mockApi.setVariable).not.toHaveBeenCalled();
		expect(mockApi.addToContext).toHaveBeenCalled();
	});

	it('should call addToContext and setVariable when variable is specified', async () => {
		mockApi.openTextDocument = vi.fn(async () => 'content');
		mockApi.addToContext = vi.fn();
		mockApi.setVariable = vi.fn();

		await specificationSkill.execute(mockApi, {
			variable: 'spec'
		});

		expect(mockApi.addToContext).toHaveBeenCalledWith('assistant', 'content');
		expect(mockApi.setVariable).toHaveBeenCalledWith('spec', 'content');
	});

	it('should re-throw non-cancellation errors', async () => {
		mockApi.openTextDocument = vi.fn(async () => {
			throw new Error('Some other error');
		});

		await expect(specificationSkill.execute(mockApi, {
			variable: 'spec'
		})).rejects.toThrow('Some other error');
	});

	it('should wrap cancellation errors with clearer message', async () => {
		mockApi.openTextDocument = vi.fn(async () => {
			throw new Error('User cancelled input');
		});

		await expect(specificationSkill.execute(mockApi, {
			variable: 'spec'
		})).rejects.toThrow('User cancelled document editing');
	});
});
