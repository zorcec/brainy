/**
 * Module: e2e/helpers/vscode-page-helpers.ts
 *
 * Description:
 *   Helper functions for interacting with VS Code Web UI using Playwright.
 *   Provides utilities to click buttons, inspect decorations, read output, etc.
 *
 * Usage:
 *   import { openFile, clickPlayButton, getOutputText } from './helpers/vscode-page-helpers';
 */

import { Page, Locator } from '@playwright/test';

/**
 * Waits for VS Code workbench to be fully loaded
 */
export async function waitForWorkbench(page: Page): Promise<void> {
	// Wait for the workbench to be visible
	await page.waitForSelector('.monaco-workbench', { timeout: 30000 });
	await page.waitForTimeout(2000); // Extra time for everything to settle
}

/**
 * Opens a file in the editor
 */
export async function openFile(page: Page, filename: string): Promise<void> {
	// Click on the file in the explorer
	// First, make sure explorer is visible
	const explorerView = page.locator('[id="workbench.view.explorer"]');
	
	// If explorer not visible, open it
	const isVisible = await explorerView.isVisible().catch(() => false);
	if (!isVisible) {
		// Click explorer icon in activity bar
		await page.click('[aria-label="Explorer (Ctrl+Shift+E)"]').catch(() => {});
		await page.waitForTimeout(500);
	}
	
	// Click the file in the tree
	const fileItem = page.locator(`.monaco-list-row:has-text("${filename}")`);
	await fileItem.click();
	await page.waitForTimeout(2000); // Wait longer for file to open and extension to activate
	
	// Wait for editor to be focused
	await page.waitForSelector('.monaco-editor.focused', { timeout: 5000 }).catch(() => {});
	await page.waitForTimeout(1000); // Extra time for CodeLens to appear
}

/**
 * Checks if play button (CodeLens) is visible on the first line
 */
export async function isPlayButtonVisible(page: Page): Promise<boolean> {
	try {
		// Wait a bit for CodeLens to render
		await page.waitForTimeout(2000);
		const playButton = page.locator('.codelens-decoration').filter({ hasText: 'Parse Playbook' });
		return await playButton.isVisible({ timeout: 8000 });
	} catch {
		return false;
	}
}

/**
 * Clicks the play button CodeLens
 */
export async function clickPlayButton(page: Page): Promise<void> {
	const playButton = page.locator('.codelens-decoration').filter({ hasText: 'Parse Playbook' });
	await playButton.waitFor({ state: 'visible', timeout: 15000 });
	await playButton.click();
	await page.waitForTimeout(2000); // Wait longer for command to execute
}

/**
 * Gets the content from the Output panel
 * Note: May not work reliably in VS Code Web - prefer using captureConsoleLogs instead
 */
export async function getOutputPanelText(page: Page, channelName: string = 'Brainy Playbook'): Promise<string> {
	// Open output panel if not already open
	await page.keyboard.press('Control+Shift+U');
	await page.waitForTimeout(500);
	
	// Select the correct output channel
	const channelSelector = page.locator('.output-select-container select');
	await channelSelector.selectOption({ label: channelName });
	await page.waitForTimeout(500);
	
	// Get the output text
	const outputText = await page.locator('.view-line').allTextContents();
	return outputText.join('\n');
}

/**
 * Captures console logs from the extension during a test action
 * Returns the captured logs after the action completes
 */
export async function captureConsoleLogs(page: Page, action: () => Promise<void>): Promise<string[]> {
	const logs: string[] = [];
	
	const handler = (msg: any) => {
		const text = msg.text();
		logs.push(text);
	};
	
	page.on('console', handler);
	await action();
	await page.waitForTimeout(2000); // Wait for logs to be emitted
	page.off('console', handler);
	
	return logs;
}

/**
 * Waits for parse command to complete by checking console logs
 */
export async function waitForParseComplete(page: Page, timeout: number = 5000): Promise<boolean> {
	const startTime = Date.now();
	let parseCompleted = false;
	
	const handler = (msg: any) => {
		const text = msg.text();
		if (text.includes('Parse result:') || text.includes('Parsed playbook:')) {
			parseCompleted = true;
		}
	};
	
	page.on('console', handler);
	
	while (!parseCompleted && (Date.now() - startTime) < timeout) {
		await page.waitForTimeout(100);
	}
	
	page.off('console', handler);
	return parseCompleted;
}

/**
 * Checks if error decorations are visible in the editor
 */
export async function hasErrorDecorations(page: Page): Promise<boolean> {
	try {
		// Look for error decorations (red squiggly lines or background highlights)
		const errorDecoration = page.locator('.monaco-editor .view-overlays .cdr.error');
		const count = await errorDecoration.count();
		return count > 0;
	} catch {
		return false;
	}
}

/**
 * Gets the hover tooltip text for a specific line
 */
export async function getHoverTooltip(page: Page, lineNumber: number): Promise<string> {
	// Get the line element
	const line = page.locator(`.view-lines > .view-line`).nth(lineNumber - 1);
	
	// Hover over it
	await line.hover();
	await page.waitForTimeout(1000); // Wait for hover to appear
	
	// Get hover content
	const hoverContent = page.locator('.monaco-hover-content');
	const isVisible = await hoverContent.isVisible().catch(() => false);
	
	if (isVisible) {
		return await hoverContent.textContent() || '';
	}
	
	return '';
}

/**
 * Checks if inline error message is visible on a specific line
 */
export async function hasInlineErrorOnLine(page: Page, lineNumber: number): Promise<boolean> {
	try {
		// Look for decorations on the specific line
		const lineDecorations = page.locator(`.view-lines > .view-line`).nth(lineNumber - 1)
			.locator('.cdr.error, .squiggly-error, .squiggly-inline-error');
		const count = await lineDecorations.count();
		return count > 0;
	} catch {
		return false;
	}
}

/**
 * Gets all visible notification messages
 */
export async function getNotifications(page: Page): Promise<string[]> {
	const notifications = page.locator('.notifications-list-container .notification-list-item-message');
	const count = await notifications.count();
	const messages: string[] = [];
	
	for (let i = 0; i < count; i++) {
		const text = await notifications.nth(i).textContent();
		if (text) {
			messages.push(text.trim());
		}
	}
	
	return messages;
}

/**
 * Closes all notifications
 */
export async function closeAllNotifications(page: Page): Promise<void> {
	const closeButtons = page.locator('.notifications-list-container .codicon-notifications-clear');
	const count = await closeButtons.count();
	
	for (let i = 0; i < count; i++) {
		await closeButtons.first().click();
		await page.waitForTimeout(200);
	}
}

/**
 * Gets the content of the active editor
 */
export async function getEditorContent(page: Page): Promise<string> {
	const lines = page.locator('.view-lines > .view-line');
	const allText = await lines.allTextContents();
	return allText.join('\n');
}

/**
 * Checks if a file is open in the editor
 */
export async function isFileOpen(page: Page, filename: string): Promise<boolean> {
	try {
		const tab = page.locator(`.tabs-container .tab:has-text("${filename}")`);
		return await tab.isVisible({ timeout: 2000 });
	} catch {
		return false;
	}
}

/**
 * Switches the color theme (for testing highlighting across themes)
 */
export async function switchTheme(page: Page, themeName: string): Promise<void> {
	// Open command palette
	await page.keyboard.press('Control+Shift+P');
	await page.waitForTimeout(500);
	
	// Type theme command
	await page.keyboard.type('Preferences: Color Theme');
	await page.keyboard.press('Enter');
	await page.waitForTimeout(500);
	
	// Select theme
	await page.keyboard.type(themeName);
	await page.keyboard.press('Enter');
	await page.waitForTimeout(1000);
}

/**
 * Checks if CodeLens decorations are present in the editor
 */
export async function hasCodeLensDecorations(page: Page): Promise<boolean> {
	try {
		const codeLens = page.locator('.codelens-decoration');
		const count = await codeLens.count();
		return count > 0;
	} catch {
		return false;
	}
}
