import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Document Skill', () => {
  test('opens real document file for editing', async ({ vscPage }) => {
    // Open the document skill test playbook
    await vscPage.openFile('skills/document/document-test.brainy.md');
    
    // Click the play button to execute the playbook (triggers the skill)
    await vscPage.clickPlayButton();

    // Wait for the document.md file to open by checking for the tab
    const documentTab = vscPage.page.locator('.tabs-container .tab').filter({ hasText: /document\.md/ }).first();
    await documentTab.waitFor({ state: 'visible', timeout: 10000 });
    
    const documentExists = await documentTab.count();
    expect(documentExists).toBeGreaterThan(0);
    
    // Document opened successfully
    await documentTab.click();
    
    // Wait for the editor to be ready
    await vscPage.page.waitForSelector('.monaco-editor', { timeout: 5000 });

    // Type some test content
    await vscPage.page.keyboard.type('Test content from e2e');

    // Save the document (Ctrl+S)
    await vscPage.page.keyboard.press('Control+s');

    // Close the document (Ctrl+W)
    await vscPage.page.keyboard.press('Control+w');

    // Wait for playbook completion instead of specific "captured" message
    const completed = await vscPage.waitForNotification('completed', 10000);
    expect(completed).toBe(true);
    
    console.log('✓ Document test completed successfully');
  });
});
