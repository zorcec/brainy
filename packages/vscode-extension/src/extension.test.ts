/**
 * Brainy Extension - Tests
 * 
 * Unit tests for the extension activation and deactivation.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock vscode module
vi.mock('vscode', () => ({
  window: { 
    showInformationMessage: vi.fn() 
  },
  commands: { 
    registerCommand: vi.fn(() => ({ dispose: vi.fn() }))
  },
}));

import * as extension from './extension';

describe('Extension', () => {
  it('should export activate as a function', () => {
    expect(typeof extension.activate).toBe('function');
  });

  it('should export deactivate as a function', () => {
    expect(typeof extension.deactivate).toBe('function');
  });

  it('activate should not throw when called with minimal context', () => {
    // Minimal stub for ExtensionContext
    const context = {
      subscriptions: [],
      workspaceState: {},
      globalState: {},
      secrets: {},
      extensionUri: {},
      environmentVariableCollection: {},
      extensionMode: 1,
      extensionPath: '',
      storagePath: '',
      globalStoragePath: '',
      logPath: '',
      asAbsolutePath: (relativePath: string) => relativePath,
      extension: {},
      globalStorageUri: {},
      logUri: {},
      storageUri: {},
      extensionRuntime: 1,
    } as any;
    
    expect(() => extension.activate(context)).not.toThrow();
  });

  it('deactivate should not throw when called', () => {
    expect(() => extension.deactivate()).not.toThrow();
  });
});
