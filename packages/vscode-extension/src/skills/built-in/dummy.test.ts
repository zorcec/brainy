/**
 * Unit tests for the dummy skill
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dummySkill } from './dummy';
import type { SkillApi } from '../types';

describe('Dummy Skill', () => {
	let mockApi: SkillApi;

	beforeEach(() => {
		mockApi = {
			setVariable: vi.fn(),
			getVariable: vi.fn(),
			addToContext: vi.fn(),
			sendRequest: vi.fn()
		} as unknown as SkillApi;

		vi.clearAllMocks();
	});

	it('should have correct metadata', () => {
		expect(dummySkill.name).toBe('dummy');
		expect(dummySkill.description).toContain('testing');
		expect(dummySkill.params).toHaveLength(3);
		expect(dummySkill.params?.[0].name).toBe('mode');
		expect(dummySkill.params?.[1].name).toBe('message');
		expect(dummySkill.params?.[2].name).toBe('delay');
		expect(dummySkill.registerAsTool).toBe(true);
	});

	it('should execute successfully in success mode (default)', async () => {
		const result = await dummySkill.execute(mockApi, {});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('agent');
		expect(result.messages[0].content).toContain('successfully');
	});

	it('should use custom message in success mode', async () => {
		const customMessage = 'Custom test message';
		const result = await dummySkill.execute(mockApi, { message: customMessage });

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].content).toBe(customMessage);
	});

	it('should throw error in error mode', async () => {
		await expect(dummySkill.execute(mockApi, { mode: 'error' })).rejects.toThrow(
			'Dummy skill error (intentional for testing)'
		);
	});

	it('should delay execution in slow mode', async () => {
		const startTime = Date.now();
		const delay = 100; // Use short delay for tests

		const result = await dummySkill.execute(mockApi, { mode: 'slow', delay: delay.toString() });

		const elapsed = Date.now() - startTime;
		
		expect(elapsed).toBeGreaterThanOrEqual(delay - 10); // Allow small margin
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].content).toContain(`${delay}ms delay`);
	});

	it('should use default delay in slow mode if not specified', async () => {
		const startTime = Date.now();

		const result = await dummySkill.execute(mockApi, { mode: 'slow' });

		const elapsed = Date.now() - startTime;
		
		expect(elapsed).toBeGreaterThanOrEqual(990); // Default 1000ms with small margin
		expect(result.messages[0].content).toContain('1000ms delay');
	});

	it('should handle invalid mode by defaulting to success', async () => {
		const result = await dummySkill.execute(mockApi, { mode: 'invalid' });

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('agent');
	});
});
