/**
 * Module: e2e/playbook/error-handling.test.ts
 *
 * Description:
 *   Tests for error handling and decorations in Brainy playbooks.
 */

import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('Error Handling and Decorations', () => {
  test.skip('parser errors trigger warning notification', async ({ vscPage }) => {
    await vscPage.openFile('playbook-with-errors.brainy.md');
    
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(3000);
    
    const notifications = await vscPage.getNotifications();
    
    const hasWarning = notifications.some((n: string) => 
      n.toLowerCase().includes('error') || n.toLowerCase().includes('warning')
    );
    expect(hasWarning).toBe(true);
  });

  test.skip('error decorations appear in editor for malformed playbook', async ({ vscPage }) => {
    await vscPage.openFile('playbook-with-errors.brainy.md');
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    const hasErrors = await vscPage.hasErrorDecorations();
    expect(hasErrors).toBe(true);
    
    await vscPage.page.screenshot({ path: 'test-results/error-decorations.png' });
  });

  test.skip('hovering over error shows tooltip with error message', async ({ vscPage }) => {
    await vscPage.openFile('playbook-with-errors.brainy.md');
    await vscPage.clickPlayButton();
    await vscPage.page.waitForTimeout(2000);
    
    const tooltip = await vscPage.getHoverTooltip(7);
    
    expect(tooltip.length).toBeGreaterThan(0);
    expect(tooltip.toLowerCase()).toContain('error');
    
    await vscPage.page.screenshot({ path: 'test-results/error-tooltip.png' });
  });
});
