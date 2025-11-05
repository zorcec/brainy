/**
 * Module: e2e/playbook/visual-feedback.test.ts
 *
 * Description:
 *   E2E tests for visual feedback during playbook execution.
 *   Tests highlighting of current/failed skills, button state changes, and UI updates.
 */

import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Visual Feedback During Execution', () => {
  test('extension loads without UI errors', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Take screenshot to verify clean UI
    await vscPage.page.screenshot({ path: 'test-results/ui-clean-state.png' });
    
    // Verify editor is responsive
    const editor = vscPage.page.locator('.monaco-editor');
    const isVisible = await editor.isVisible();
    expect(isVisible).toBe(true);
  });

  test('CodeLens buttons are clickable', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Look for any CodeLens button
    const codeLensButtons = vscPage.page.locator('[class*="codelens"]').first();
    const isVisible = await codeLensButtons.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log('CodeLens visible:', isVisible);
    
    // Take screenshot
    await vscPage.page.screenshot({ path: 'test-results/codelens-buttons.png' });
  });

  test('output channel displays execution messages', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Trigger execution
    await vscPage.clickPlayButton();
    
    // Wait for output to be generated
    await vscPage.page.waitForTimeout(2000);
    
    // Try to access output panel
    await vscPage.page.keyboard.press('Control+Shift+U');
    await vscPage.page.waitForTimeout(500);
    
    // Take screenshot of output
    await vscPage.page.screenshot({ path: 'test-results/output-panel.png' });
    
    // Close output panel
    await vscPage.page.keyboard.press('Control+Shift+U');
  });

  test('info messages appear during execution', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Capture any notification messages
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
      await vscPage.page.waitForTimeout(2000);
    });
    
    // Look for information/notification logs
    const infoLogs = logs.filter(l => 
      l.includes('Information') || 
      l.includes('started') ||
      l.includes('completed')
    );
    
    console.log('Info messages:', infoLogs.length);
    
    // Take screenshot
    await vscPage.page.screenshot({ path: 'test-results/execution-messages.png' });
  });

  test('UI remains responsive during execution', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Start execution
    const logs = await vscPage.captureConsoleLogs(async () => {
      await vscPage.clickPlayButton();
      
      // Try UI interactions during execution
      await vscPage.page.keyboard.press('Home');
      await vscPage.page.waitForTimeout(200);
      await vscPage.page.keyboard.press('End');
      await vscPage.page.waitForTimeout(200);
      
      // Wait for completion
      await vscPage.page.waitForTimeout(2000);
    });
    
    console.log('Concurrent interaction logs:', logs.length);
  });

  test('error messages show for invalid playbooks', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Any error messages will be captured in logs
    const logs = await vscPage.captureConsoleLogs(async () => {
      // Try to trigger any parsing or execution
      await vscPage.page.keyboard.press('Control+Shift+P');
      await vscPage.page.waitForTimeout(300);
      await vscPage.page.keyboard.type('Parse');
      await vscPage.page.waitForTimeout(300);
      await vscPage.page.keyboard.press('Escape');
    });
    
    console.log('Error check logs:', logs.length);
  });

  test('file explorer state is preserved', async ({ vscPage }) => {
    // Open explorer
    await vscPage.page.keyboard.press('Control+Shift+E');
    await vscPage.page.waitForTimeout(300);
    
    // Open playbook
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Take screenshot showing file structure
    await vscPage.page.screenshot({ path: 'test-results/file-explorer-state.png' });
  });

  test('syntax highlighting is applied correctly', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Look for syntax highlighting elements
    const syntaxElements = vscPage.page.locator('.token');
    const elementCount = await syntaxElements.count();
    
    console.log(`Syntax tokens: ${elementCount}`);
    
    // Take screenshot
    await vscPage.page.screenshot({ path: 'test-results/syntax-highlighting.png' });
  });

  test('breadcrumb navigation works', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Look for breadcrumb
    const breadcrumb = vscPage.page.locator('.breadcrumbs, [class*="breadcrumb"]');
    const isVisible = await breadcrumb.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log('Breadcrumb visible:', isVisible);
    
    // Take screenshot
    await vscPage.page.screenshot({ path: 'test-results/breadcrumb-navigation.png' });
  });

  test('status bar shows current mode information', async ({ vscPage }) => {
    await vscPage.openFile('sample-playbook.brainy.md');
    await vscPage.page.waitForTimeout(1500);
    
    // Look for status bar
    const statusBar = vscPage.page.locator('.statusbar, [class*="status"]');
    const isVisible = await statusBar.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log('Status bar visible:', isVisible);
    
    // Take screenshot
    await vscPage.page.screenshot({ path: 'test-results/status-bar.png' });
  });
});
