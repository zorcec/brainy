/**
 * Module: e2e/playbook/skill-execution.test.ts
 *
 * Description:
 *   Tests for skill execution functionality with JavaScript and TypeScript.
 */

import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Skill Execution - JavaScript', () => {
  test('basic.js skill can be loaded and returns hello world', async ({ vscPage }) => {
    await vscPage.openFile('execute-test.brainy.md');
    
    const isOpen = await vscPage.isFileOpen('execute-test.brainy.md');
    expect(isOpen).toBe(true);
    
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
    });
    
    const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
    expect(parsedLog).toBeDefined();
    expect(parsedLog).toContain('execute');
  });

  test('@execute annotation is highlighted in playbook', async ({ vscPage }) => {
    await vscPage.openFile('execute-test.brainy.md');
    
    const content = await vscPage.getEditorContent();
    expect(content).toContain('@execute');
    
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(1500);
    
    const notifications = await vscPage.getNotifications();
    const hasSuccess = notifications.some((n: string) => 
      n.includes('parsed successfully') || n.includes('block')
    );
    expect(hasSuccess).toBe(true);
  });
});

test.describe('Skill Execution - TypeScript', () => {
  test('execute.ts skill can be loaded with TypeScript support', async ({ vscPage }) => {
    await vscPage.openFile('execute-test.brainy.md');
    
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    const notifications = await vscPage.getNotifications();
    const hasSuccess = notifications.some((n: string) => 
      n.includes('parsed successfully') || n.includes('block')
    );
    expect(hasSuccess).toBe(true);
  });

  test('both JS and TS execute skills are recognized in same playbook', async ({ vscPage }) => {
    await vscPage.openFile('execute-test.brainy.md');
    
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
    });
    
    const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
    expect(parsedLog).toBeDefined();
    
    const executeCount = (parsedLog?.match(/"name":\s*"execute"/g) || []).length;
    expect(executeCount).toBeGreaterThan(1);
  });
});

test.describe('Skill Execution - Integration', () => {
  test('playbook with @execute shows proper annotations', async ({ vscPage }) => {
    await vscPage.openFile('execute-test.brainy.md');
    
    await vscPage.page.waitForTimeout(1000);
    
    const content = await vscPage.getEditorContent();
    expect(content).toContain('@execute');
    expect(content).toContain('JavaScript');
    expect(content).toContain('TypeScript');
  });

  test('parse result includes execute annotation blocks', async ({ vscPage }) => {
    await vscPage.openFile('execute-test.brainy.md');
    
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
    });
    
    const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
    expect(parsedLog).toBeDefined();
    
    const nameExecuteRegex = /(?:\\u001b\[[0-9;]*m)?\s*"name"\s*:\s*"execute"/i;
    expect(nameExecuteRegex.test(parsedLog!)).toBe(true);
    
    expect(parsedLog).toContain('plainCodeBlock');
  });

  test('execute test playbook has play button', async ({ vscPage }) => {
    await vscPage.openFile('execute-test.brainy.md');
    
    const hasPlayButton = await vscPage.isPlayButtonVisible();
    expect(hasPlayButton).toBe(true);
    
    await vscPage.page.screenshot({ path: 'test-results/execute-test-playbook.png' });
  });
});
