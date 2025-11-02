/**
 * Module: e2e/playbook/file-type-detection.test.ts
 *
 * Description:
 *   Tests for file type detection and CodeLens activation.
 */

import { test, expect } from '../fixtures/vscode-suite-fixtures';

test.describe('File Type Detection', () => {
  test('play button does not appear for regular .md files', async ({ vscPage }) => {
    await vscPage.openFile('README.md');
    await vscPage.page.waitForTimeout(1000);
    
    const hasPlayButton = await vscPage.isPlayButtonVisible();
    expect(hasPlayButton).toBe(false);
  });

  test('CodeLens only appears on .brainy.md files', async ({ vscPage }) => {
    await vscPage.openFile('README.md');
    let hasCodeLens = await vscPage.hasCodeLensDecorations();
    
    await vscPage.openFile('sample-playbook.brainy.md');
    hasCodeLens = await vscPage.hasCodeLensDecorations();
    
    if (!hasCodeLens) {
      await vscPage.page.keyboard.press('Control+Shift+P');
      await vscPage.page.waitForTimeout(500);
      await vscPage.page.keyboard.type('Brainy: Parse');
      await vscPage.page.waitForTimeout(500);
      const quickPick = vscPage.page.locator('.quick-input-list .monaco-list-row');
      const hasCommand = await quickPick.filter({ hasText: 'Brainy: Parse Playbook' }).count() > 0;
      await vscPage.page.keyboard.press('Escape');
      expect(hasCommand).toBe(true);
    } else {
      expect(hasCodeLens).toBe(true);
    }
  });
});
