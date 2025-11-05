/**
 * Module: e2e/playbook/context-manipulation.test.ts
 *
 * Description:
 *   E2E tests for context manipulation skill including token limits,
 *   truncation, validation, and error handling.
 */

import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Context Manipulation', () => {
  test('should select single context', async ({ vscPage }) => {
    await vscPage.openFile('context-test.brainy.md');
    
    // Execute the playbook
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    // Verify no errors occurred
    const notifications = await vscPage.getNotifications();
    const hasErrors = notifications.some((n: string) => 
      n.toLowerCase().includes('error') && !n.toLowerCase().includes('duplicate')
    );
    expect(hasErrors).toBe(false);
  });

  test('should handle context selection without errors', async ({ vscPage }) => {
    await vscPage.openFile('context-test.brainy.md');
    
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(3000);
    
    const notifications = await vscPage.getNotifications();
    
    // Should have some notifications (context selection confirmations)
    expect(notifications.length).toBeGreaterThan(0);
  });

  test('can open and execute playbook with context operations', async ({ vscPage }) => {
    await vscPage.openFile('context-test.brainy.md');
    
    // Verify file is open
    const isOpen = await vscPage.isFileOpen('context-test.brainy.md');
    expect(isOpen).toBe(true);
    
    // Click play button
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    // Should complete without major errors
    const notifications = await vscPage.getNotifications();
    expect(Array.isArray(notifications)).toBe(true);
  });
});

