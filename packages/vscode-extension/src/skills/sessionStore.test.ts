/**
 * Unit tests for session store.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
	getSelectedModel,
	setSelectedModel,
	clearSelectedModel,
	resetSessionStore
} from './sessionStore';

describe('sessionStore', () => {
	beforeEach(() => {
		// Reset singleton state before each test
		resetSessionStore();
	});

	test('returns undefined when no model is selected', () => {
		expect(getSelectedModel()).toBeUndefined();
	});

	test('sets and gets selected model', () => {
		setSelectedModel('gpt-4o');
		expect(getSelectedModel()).toBe('gpt-4o');
	});

	test('overwrites previous model selection', () => {
		setSelectedModel('gpt-4o');
		setSelectedModel('claude-3');
		expect(getSelectedModel()).toBe('claude-3');
	});

	test('clears selected model', () => {
		setSelectedModel('gpt-4o');
		clearSelectedModel();
		expect(getSelectedModel()).toBeUndefined();
	});

	test('handles multiple set and clear operations', () => {
		setSelectedModel('model-1');
		expect(getSelectedModel()).toBe('model-1');
		
		clearSelectedModel();
		expect(getSelectedModel()).toBeUndefined();
		
		setSelectedModel('model-2');
		expect(getSelectedModel()).toBe('model-2');
		
		setSelectedModel('model-3');
		expect(getSelectedModel()).toBe('model-3');
	});

	test('reset clears the selected model', () => {
		setSelectedModel('gpt-4o');
		resetSessionStore();
		expect(getSelectedModel()).toBeUndefined();
	});
});
