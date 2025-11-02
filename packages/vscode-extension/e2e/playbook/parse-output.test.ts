/**
 * Module: e2e/playbook/parse-output.test.ts
 *
 * Description:
 *   Tests for playbook parsing and output functionality.
 */

import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Parse and Output', () => {
  test('clicking play button parses file and shows output', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
    });
    
    const hasParseLog = logs.some((log: string) => log.includes('Parse command triggered'));
    const hasResultLog = logs.some((log: string) => log.includes('Parse result:'));
    const hasParsedLog = logs.some((log: string) => log.includes('Parsed playbook:'));
    
    expect(hasParseLog).toBe(true);
    expect(hasResultLog || hasParsedLog).toBe(true);
    
    await vscPage.page.waitForTimeout(1000);
    const notifications = await vscPage.getNotifications();
    const hasSuccessNotification = notifications.some((msg: string) => 
      msg.includes('parsed successfully') || msg.includes('block')
    );
    expect(hasSuccessNotification).toBe(true);
  });

  test('output is formatted as pretty JSON', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
    });
    
    const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
    expect(parsedLog).toBeDefined();
    
    expect(parsedLog).toContain('"blocks"');
    expect(parsedLog).toContain('"errors"');
    expect(parsedLog).toContain('"name"');
  });

  test('success notification appears for valid playbook', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    const notifications = await vscPage.getNotifications();
    
    const hasSuccess = notifications.some((n: string) => 
      n.includes('parsed successfully') || n.includes('block')
    );
    
    expect(hasSuccess).toBe(true);
  });

  test('editor remains functional after parsing', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(1500);
    
    const content = await vscPage.getEditorContent();
    expect(content.length).toBeGreaterThan(0);
    
    const isOpen = await vscPage.isFileOpen('sample-playbook.brainy.md');
    expect(isOpen).toBe(true);
  });
});
