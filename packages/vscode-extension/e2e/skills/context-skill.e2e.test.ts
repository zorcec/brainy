import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Context Skill E2E', () => {
  test('switches context and maintains state', async ({ vscPage }) => {
    await vscPage.openFile('skills/context/context-test.brainy.md');
    await vscPage.clickPlayButton();
    
    // Wait longer for execution to complete
    await vscPage.page.waitForTimeout(5000);
    
    // Check for completion notification
    const notifications = await vscPage.getNotifications();
    console.log('Notifications found:', notifications);
    
    const hasCompleted = notifications.some(n => 
      n.toLowerCase().includes('playbook execution completed') ||
      n.toLowerCase().includes('execution completed')
    );
    const hasError = notifications.some(n =>
      n.toLowerCase().includes('error') || n.toLowerCase().includes('failed')
    );
    
    expect(hasError).toBe(false);
    expect(hasCompleted).toBe(true);
  });
});
