import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('File Skill E2E', () => {
  test('writes, reads, and deletes file', async ({ vscPage }) => {
    await vscPage.openFile('skills/file/file-test.brainy.md');
    await vscPage.clickPlayButton();
    
    // Wait for all file operations to complete
    await vscPage.page.waitForTimeout(2000);
    
    // Check for completion
    const notifications = await vscPage.getNotifications();
    const hasCompleted = notifications.some(n => 
      n.toLowerCase().includes('playbook execution completed')
    );
    const hasError = notifications.some(n =>
      n.toLowerCase().includes('error') || n.toLowerCase().includes('failed')
    );
    
    expect(hasError).toBe(false);
    expect(hasCompleted).toBe(true);
  });
});
