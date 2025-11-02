/**
 * Module: e2e/playbook/content-verification.test.ts
 *
 * Description:
 *   Tests for verifying parsed playbook content structure.
 */

import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Content Verification', () => {
  test('parsed output contains annotation blocks', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
    });
    
    const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
    expect(parsedLog).toBeDefined();
    
    expect(parsedLog).toContain('"name"');
    expect(parsedLog).toContain('"flags"');
    expect(parsedLog).toContain('"content"');
  });

  test('parsed output contains code blocks', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
    });
    
    const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
    
    expect(parsedLog).toContain('plainCodeBlock');
  });
});
