/**
 * Unit tests for executionState module
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
	getExecutionState,
	setExecutionState,
	resetExecutionState,
	resetAllExecutionState,
	isPlaybookRunning,
	getCurrentlyExecutingPlaybook,
	markPlaybookStarted,
	markPlaybookFinished,
	type ExecutionState
} from './executionState';

describe('executionState', () => {
	beforeEach(() => {
		resetAllExecutionState();
	});

	describe('getExecutionState', () => {
		test('returns idle for unset editor', () => {
			const state = getExecutionState('file:///test.md');
			expect(state).toBe('idle');
		});

		test('returns set state for editor', () => {
			const uri = 'file:///test.md';
			setExecutionState(uri, 'running');
			const state = getExecutionState(uri);
			expect(state).toBe('running');
		});
	});

	describe('setExecutionState', () => {
		test('sets state for editor', () => {
			const uri = 'file:///test.md';
			setExecutionState(uri, 'running');
			expect(getExecutionState(uri)).toBe('running');
		});

		test('updates state for editor', () => {
			const uri = 'file:///test.md';
			setExecutionState(uri, 'running');
			setExecutionState(uri, 'paused');
			expect(getExecutionState(uri)).toBe('paused');
		});

		test('supports all state values', () => {
			const uri = 'file:///test.md';
			const states: ExecutionState[] = ['idle', 'running', 'paused', 'stopped', 'error'];
			
			for (const state of states) {
				setExecutionState(uri, state);
				expect(getExecutionState(uri)).toBe(state);
			}
		});

		test('manages state independently per editor', () => {
			const uri1 = 'file:///test1.md';
			const uri2 = 'file:///test2.md';
			
			setExecutionState(uri1, 'running');
			setExecutionState(uri2, 'paused');
			
			expect(getExecutionState(uri1)).toBe('running');
			expect(getExecutionState(uri2)).toBe('paused');
		});
	});

	describe('resetExecutionState', () => {
		test('resets state to idle for editor', () => {
			const uri = 'file:///test.md';
			setExecutionState(uri, 'running');
			resetExecutionState(uri);
			expect(getExecutionState(uri)).toBe('idle');
		});

		test('does not affect other editors', () => {
			const uri1 = 'file:///test1.md';
			const uri2 = 'file:///test2.md';
			
			setExecutionState(uri1, 'running');
			setExecutionState(uri2, 'paused');
			
			resetExecutionState(uri1);
			
			expect(getExecutionState(uri1)).toBe('idle');
			expect(getExecutionState(uri2)).toBe('paused');
		});
	});

	describe('resetAllExecutionState', () => {
		test('clears all states', () => {
			const uri1 = 'file:///test1.md';
			const uri2 = 'file:///test2.md';
			
			setExecutionState(uri1, 'running');
			setExecutionState(uri2, 'paused');
			
			resetAllExecutionState();
			
			expect(getExecutionState(uri1)).toBe('idle');
			expect(getExecutionState(uri2)).toBe('idle');
		});
	});

	describe('playbook concurrency control', () => {
		test('isPlaybookRunning returns false initially', () => {
			expect(isPlaybookRunning()).toBe(false);
		});

		test('markPlaybookStarted sets running flag and state', () => {
			const uri = 'file:///test.md';
			markPlaybookStarted(uri);
			
			expect(isPlaybookRunning()).toBe(true);
			expect(getCurrentlyExecutingPlaybook()).toBe(uri);
			expect(getExecutionState(uri)).toBe('running');
		});

		test('markPlaybookFinished clears running flag and resets state', () => {
			const uri = 'file:///test.md';
			markPlaybookStarted(uri);
			markPlaybookFinished(uri);
			
			expect(isPlaybookRunning()).toBe(false);
			expect(getCurrentlyExecutingPlaybook()).toBeUndefined();
			expect(getExecutionState(uri)).toBe('idle');
		});

		test('markPlaybookStarted throws error if another playbook is running', () => {
			const uri1 = 'file:///test1.md';
			const uri2 = 'file:///test2.md';
			
			markPlaybookStarted(uri1);
			
			expect(() => markPlaybookStarted(uri2)).toThrow('A playbook is already running');
			expect(getCurrentlyExecutingPlaybook()).toBe(uri1);
		});

		test('markPlaybookStarted allows same playbook to restart', () => {
			const uri = 'file:///test.md';
			
			markPlaybookStarted(uri);
			markPlaybookStarted(uri); // Should not throw
			
			expect(isPlaybookRunning()).toBe(true);
			expect(getCurrentlyExecutingPlaybook()).toBe(uri);
		});

		test('resetAllExecutionState clears global running flag', () => {
			const uri = 'file:///test.md';
			markPlaybookStarted(uri);
			
			resetAllExecutionState();
			
			expect(isPlaybookRunning()).toBe(false);
			expect(getCurrentlyExecutingPlaybook()).toBeUndefined();
		});
	});
});
