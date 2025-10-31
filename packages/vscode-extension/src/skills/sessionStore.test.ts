/**
 * Unit tests for session store.
 */

import { describe, test, expect } from 'vitest';
import { createSessionStore } from './sessionStore';

describe('createSessionStore', () => {
	test('creates independent store instances', () => {
		const store1 = createSessionStore();
		const store2 = createSessionStore();
		
		store1.setSelectedModel('gpt-4o');
		store2.setSelectedModel('claude-3');
		
		expect(store1.getSelectedModel()).toBe('gpt-4o');
		expect(store2.getSelectedModel()).toBe('claude-3');
	});

	test('returns undefined when no model is selected', () => {
		const store = createSessionStore();
		expect(store.getSelectedModel()).toBeUndefined();
	});

	test('sets and gets selected model', () => {
		const store = createSessionStore();
		store.setSelectedModel('gpt-4o');
		expect(store.getSelectedModel()).toBe('gpt-4o');
	});

	test('overwrites previous model selection', () => {
		const store = createSessionStore();
		store.setSelectedModel('gpt-4o');
		store.setSelectedModel('claude-3');
		expect(store.getSelectedModel()).toBe('claude-3');
	});

	test('clears selected model', () => {
		const store = createSessionStore();
		store.setSelectedModel('gpt-4o');
		store.clearSelectedModel();
		expect(store.getSelectedModel()).toBeUndefined();
	});

	test('handles multiple set and clear operations', () => {
		const store = createSessionStore();
		
		store.setSelectedModel('model-1');
		expect(store.getSelectedModel()).toBe('model-1');
		
		store.clearSelectedModel();
		expect(store.getSelectedModel()).toBeUndefined();
		
		store.setSelectedModel('model-2');
		expect(store.getSelectedModel()).toBe('model-2');
		
		store.setSelectedModel('model-3');
		expect(store.getSelectedModel()).toBe('model-3');
	});
});
