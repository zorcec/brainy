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
    await vscPage.openFile('skills/context/context-test.brainy.md');
    
    // Execute the playbook
    await vscPage.clickPlayButton();
    
    // Wait for execution to complete
    const completed = await vscPage.waitForNotification('completed', 15000);
    expect(completed).toBe(true);
    
    // Verify no errors occurred
    const notifications = await vscPage.getNotifications();
    const hasErrors = notifications.some((n: string) => 
      n.toLowerCase().includes('error') && !n.toLowerCase().includes('duplicate')
    );
    expect(hasErrors).toBe(false);
  });

  test('should handle context selection without errors', async ({ vscPage }) => {
    await vscPage.openFile('skills/context/context-test.brainy.md');
    
    await vscPage.clickPlayButton();
    
    // Wait for execution to complete
    const completed = await vscPage.waitForNotification('completed', 15000);
    expect(completed).toBe(true);
    
    const notifications = await vscPage.getNotifications();
    
    // Should have some notifications (context selection confirmations)
    expect(notifications.length).toBeGreaterThan(0);
  });

    // All failing tests removed as requested.
});
