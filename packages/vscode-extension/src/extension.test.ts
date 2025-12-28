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
    workspaceFolders: undefined as any,
    createFileSystemWatcher: vi.fn(() => ({
      onDidCreate: vi.fn(() => ({ dispose: vi.fn() })),
      onDidDelete: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
      dispose: vi.fn()
    }))
  };

  class MockSemanticTokensLegend {
    tokenTypes: string[];
    tokenModifiers: string[];
    constructor(tokenTypes: string[], tokenModifiers: string[]) {
      this.tokenTypes = tokenTypes;
      this.tokenModifiers = tokenModifiers;
    }
  }

  class MockSemanticTokensBuilder {
    private legend: MockSemanticTokensLegend;
    constructor(legend: MockSemanticTokensLegend) {
      this.legend = legend;
    }
    push() { }
    build() {
      return { data: new Uint32Array([]) };
    }
  }

  class MockRange {
    start: any;
    end: any;
    constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
      this.start = { line: startLine, character: startChar };
      this.end = { line: endLine, character: endChar };
    }
  }

  class MockPosition {
    line: number;
    character: number;
    constructor(line: number, character: number) {
      this.line = line;
      this.character = character;
    }
  }

  class MockUri {
    static parse(value: string) {
      return { fsPath: value };
    }
  }

  class MockEventEmitter {
    private listeners: Set<Function> = new Set();

    fire(data?: any) {
      this.listeners.forEach(listener => listener(data));
    }

    get event() {
      return (listener: Function) => {
        this.listeners.add(listener);
        return { dispose: () => this.listeners.delete(listener) };
      };
    }
  }

  return {
    RelativePattern: class {
      base: string;
      pattern: string;
      constructor(base: any, pattern: string) {
        this.base = base;
        this.pattern = pattern;
      }
    },
    lm: {
      registerTool: vi.fn(),
    },
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
    languages: {
      registerDocumentSemanticTokensProvider: vi.fn(() => ({ dispose: vi.fn() })),
      registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
      registerCodeLensProvider: vi.fn(() => ({ dispose: vi.fn() })),
      registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() }))
    },
    workspace: mockWorkspace,
    SemanticTokensLegend: MockSemanticTokensLegend,
    SemanticTokensBuilder: MockSemanticTokensBuilder,
    SemanticTokens: class { data: Uint32Array = new Uint32Array([]) },
    Range: MockRange,
    Position: MockPosition,
    Uri: MockUri,
    EventEmitter: MockEventEmitter,
    EndOfLine: { LF: 1, CRLF: 2 },
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
  const startSpy = vi.spyOn(brainyServerManager, 'startBrainyServer').mockImplementation(() => { });
  const stopSpy = vi.spyOn(brainyServerManager, 'stopBrainyServer').mockImplementation(() => { });

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

    return extension.activate(context).then(() => {
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'brainy.configure',
        expect.any(Function)
      );
      expect(startSpy).toHaveBeenCalled();
    });
  });

  it('deactivate should not throw when called', () => {
    expect(() => extension.deactivate()).not.toThrow();
    expect(stopSpy).toHaveBeenCalled();
  });
});
