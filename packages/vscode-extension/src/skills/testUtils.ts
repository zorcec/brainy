/**
 * Module: skills/testUtils.ts
 *
 * Description:
 *   Test utilities for built-in skill testing.
 *   Provides a centralized mock SkillApi implementation that imports the real SkillApi type
 *   and reflects all properties/APIs. This mock is reused by all built-in skill tests to
 *   ensure consistency and reduce duplication.
 *
 * Usage:
 *   import { createMockSkillApi } from '../testUtils';
 *   const mockApi = createMockSkillApi();
 *   await mySkill.execute(mockApi, params);
 *   expect(mockApi.sendRequest).toHaveBeenCalledWith(...);
 */

import { vi } from 'vitest';
import type { SkillApi } from './types';

/**
 * Creates a mock SkillApi implementation for testing built-in skills.
 * 
 * This mock imports the real SkillApi type and implements all its methods using vi.fn().
 * The mock is designed to be reused across all built-in skill tests for consistency.
 * 
 * IMPORTANT: Keep this mock in sync with the real SkillApi interface in types.ts.
 * If you add, remove, or modify methods in SkillApi, update this mock accordingly.
 * See the comment in types.ts (SkillApi interface) for a reminder to update this file.
 * 
 * @returns A mock SkillApi object with vi.fn() spies for all methods
 * 
 * @example
 * ```typescript
 * const mockApi = createMockSkillApi();
 * 
 * // Use the mock in skill execution
 * await mySkill.execute(mockApi, params);
 * 
 * // Verify method calls
 * expect(mockApi.sendRequest).toHaveBeenCalledWith('user', 'test content', 'gpt-4o');
 * 
 * // Mock return values
 * mockApi.sendRequest.mockResolvedValue({ response: 'mocked response' });
 * ```
 */
export function createMockSkillApi(): SkillApi {
	return {
		/**
		 * Mock implementation of sendRequest.
		 * By default, returns a promise resolving to { response: 'mock response' }.
		 * Override with mockResolvedValue() or mockImplementation() as needed.
		 */
		sendRequest: vi.fn(async (role, content, modelId, options) => {
			return { response: `Mock response for: ${content}` };
		}),

		/**
		 * Mock implementation of selectChatModel.
		 * By default, returns a resolved promise.
		 * Override with mockResolvedValue() or mockImplementation() as needed.
		 */
		selectChatModel: vi.fn(async (modelId) => {
			// No-op by default
		}),

		/**
		 * Mock implementation of getAllAvailableTools.
		 * By default, returns an empty array.
		 * Override with mockResolvedValue() or mockImplementation() as needed.
		 */
		getAllAvailableTools: vi.fn(async () => {
			return [];
		}),

		/**
		 * Mock implementation of getParsedBlocks.
		 * By default, returns an empty array.
		 * Override with mockReturnValue() or mockImplementation() as needed.
		 */
		getParsedBlocks: vi.fn(() => {
			return [];
		}),

		/**
		 * Mock implementation of getCurrentBlockIndex.
		 * By default, returns 0.
		 * Override with mockReturnValue() or mockImplementation() as needed.
		 */
		getCurrentBlockIndex: vi.fn(() => {
			return 0;
		}),

		/**
		 * Mock implementation of setVariable.
		 * By default, does nothing.
		 * Override with mockImplementation() as needed.
		 */
		setVariable: vi.fn((name, value) => {
			// No-op by default
		}),

		/**
		 * Mock implementation of getVariable.
		 * By default, returns undefined.
		 * Override with mockReturnValue() or mockImplementation() as needed.
		 */
		getVariable: vi.fn((name) => {
			return undefined;
		}),

		/**
		 * Mock implementation of openInputDialog.
		 * By default, returns a promise resolving to 'mock input'.
		 * Override with mockResolvedValue() or mockRejectedValue() as needed.
		 */
		openInputDialog: vi.fn(async (prompt) => {
			return 'mock input';
		}),

		/**
		 * Mock implementation of addToContext.
		 * By default, does nothing.
		 * Override with mockImplementation() as needed.
		 */
		addToContext: vi.fn((role, content) => {
			// No-op by default
		})
,
		/**
		 * Mock implementation of getContext.
		 * By default, returns an empty array.
		 * Override with mockReturnValue() or mockImplementation() as needed.
		 */
		getContext: vi.fn(() => {
			return [];
		})
	};
}
