/**
 * Module: e2e/playbook/multiple-operations.test.ts
 *
 * Description:
 *   Tests for multiple parse operations and sequential file handling.
 */

import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Multiple Parse Operations', () => {
  test('can parse the same file multiple times', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    const notifications = await vscPage.getNotifications();
    expect(notifications.length).toBeGreaterThan(0);
  });

  test('can parse different files sequentially', async ({ vscPage }) => {
    test.setTimeout(45000);
    
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    await vscPage.openFile('playbook-with-errors.brainy.md');
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    const notifications = await vscPage.getNotifications();
    expect(notifications.length).toBeGreaterThan(0);
  });
});
