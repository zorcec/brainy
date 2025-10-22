/**
 * Brainy Extension - Tests
 * 
 * Unit tests for the extension activation and configuration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Mock vscode module - must be self-contained
vi.mock('vscode', () => {
  const mockWorkspace = {
    workspaceFolders: undefined as any
  };
  
  return {
    window: { 
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn()
    },
    commands: { 
      registerCommand: vi.fn((id, callback) => {
        // Store callback for testing
        if (id === 'brainy.configure') {
          (global as any).brainyConfigureCallback = callback;
        }
        return { dispose: vi.fn() };
      })
    },
    workspace: mockWorkspace,
    _mockWorkspace: mockWorkspace  // Expose for testing
  };
});

import * as vscode from 'vscode';
import * as extension from './extension';
import * as brainyServerManager from './brainyServerManager';
import { isConfigured, resetConfiguration } from '../../server/dist/server.js';

const workspaceMock = (vscode as any)._mockWorkspace;

describe('Extension', () => {
  let testDir: string;

  // Mock start/stopBrainyServer
  const startSpy = vi.spyOn(brainyServerManager, 'startBrainyServer').mockImplementation(() => {});
  const stopSpy = vi.spyOn(brainyServerManager, 'stopBrainyServer').mockImplementation(() => {});

  beforeEach(() => {
    resetConfiguration();
    testDir = path.join(os.tmpdir(), `brainy-ext-test-${Date.now()}`);
    workspaceMock.workspaceFolders = [{ uri: { fsPath: testDir } }];
    startSpy.mockClear();
    stopSpy.mockClear();
  });

  afterEach(() => {
    resetConfiguration();
    workspaceMock.workspaceFolders = undefined;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    startSpy.mockClear();
    stopSpy.mockClear();
  });

  it('should export activate as a function', () => {
    expect(typeof extension.activate).toBe('function');
  });

  it('should export deactivate as a function', () => {
    expect(typeof extension.deactivate).toBe('function');
  });


  it('should register brainy.configure command', () => {
    const context = {
      subscriptions: [],
    } as any;
    
    extension.activate(context);
    
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'brainy.configure',
      expect.any(Function)
    );
    expect(startSpy).toHaveBeenCalled();
  });

  it('deactivate should not throw when called', () => {
    expect(() => extension.deactivate()).not.toThrow();
    expect(stopSpy).toHaveBeenCalled();
  });
});
