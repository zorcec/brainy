import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Dummy Skill E2E', () => {
  test('executes in success mode', async ({ vscPage }) => {
    await vscPage.openFile('skills/dummy/dummy-test.brainy.md');
    
    // Wait for file to be loaded and parsed
    await vscPage.page.waitForTimeout(1000);
    
    // Verify content loaded
    const content = await vscPage.getEditorContent();
    expect(content).toContain('@dummy');
    
    await vscPage.clickPlayButton();
    
    // Wait for execution to complete with longer timeout
    await vscPage.page.waitForTimeout(3000);
    
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
    
    // Wait for file to be loaded and parsed
    await vscPage.page.waitForTimeout(1000);
    
    // Play the playbook - if skill isn't registered, it would show an error
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(3000);
    
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
