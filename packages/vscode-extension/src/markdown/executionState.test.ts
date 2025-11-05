/**
 * Unit tests for executionState module
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
	getExecutionState,
	setExecutionState,
	resetExecutionState,
	resetAllExecutionState,
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
});
