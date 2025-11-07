import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Dummy Skill E2E', () => {
  test('executes in success mode', async ({ vscPage }) => {
    await vscPage.openFile('skills/dummy/dummy-test.brainy.md');
    await vscPage.clickPlayButton();
    
    // Wait for execution to complete
    await vscPage.page.waitForTimeout(2000);
    
    // Check for completion notification
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

  test('dummy skill is registered as a tool', async ({ vscPage }) => {
    // Open the dummy test playbook
    await vscPage.openFile('skills/dummy/dummy-test.brainy.md');
    
    // Play the playbook - if skill isn't registered, it would show an error
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
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
