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
	// Reduced wait time for faster test execution
	await page.waitForTimeout(2000).catch(() => {});
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
	await fileItem.click().catch(() => {});
	// Reduced wait time for faster test execution
	await page.waitForTimeout(2000).catch(() => {});
	
	// Reduced wait time for CodeLens to appear
	await page.waitForTimeout(1000).catch(() => {});
}

/**
 * Checks if play button (CodeLens) is visible on the first line
 */
export async function isPlayButtonVisible(page: Page): Promise<boolean> {
	try {
		// Reduced wait time for faster test execution
		await page.waitForTimeout(1500);
		
		// Try multiple possible selectors for CodeLens
		const selectors = [
			'.codelens-decoration',
			'.contentWidgets .codicon-run',
			'[class*="codelens"]',
			'[class*="CodeLens"]'
		];
		
		for (const selector of selectors) {
			const element = page.locator(selector).filter({ hasText: 'Parse Playbook' }).first();
			const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
			if (isVisible) {
				console.log(`Found CodeLens with selector: ${selector}`);
				return true;
			}
		}
		
		// Also check for any CodeLens without text filter
		for (const selector of selectors) {
			const element = page.locator(selector).first();
			const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
			if (isVisible) {
				console.log(`Found CodeLens element with selector: ${selector} (no text filter)`);
				const text = await element.textContent();
				console.log(`CodeLens text: ${text}`);
				return true;
			}
		}
		
		return false;
	} catch (e) {
		console.error('Error checking for play button:', e);
		return false;
	}
}

/**
 * Clicks the play button CodeLens or triggers parse command via command palette as fallback
 */
export async function clickPlayButton(page: Page): Promise<void> {
	try {
		// Try to find and click CodeLens first
		const selectors = [
			'.codelens-decoration',
			'.contentWidgets .codicon-run',
			'[class*="codelens"]',
			'[class*="CodeLens"]'
		];
		
		let clicked = false;
		for (const selector of selectors) {
			const playButton = page.locator(selector).filter({ hasText: 'Parse Playbook' }).first();
			const isVisible = await playButton.isVisible({ timeout: 2000 }).catch(() => false);
			if (isVisible) {
				console.log(`Clicking CodeLens with selector: ${selector}`);
				await playButton.click();
				clicked = true;
				break;
			}
		}
		
		// Fallback: use command palette if CodeLens not found
		if (!clicked) {
			console.log('CodeLens not found, using command palette fallback');
			await page.keyboard.press('Control+Shift+P');
			await page.waitForTimeout(500);
			await page.keyboard.type('Brainy: Parse Playbook');
			await page.waitForTimeout(300);
			await page.keyboard.press('Enter');
		}
		
		// Reduced wait time for command to execute
		await page.waitForTimeout(2000).catch(() => {});
	} catch (e) {
		console.error('Error clicking play button:', e);
		throw e;
	}
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
	// Reduced wait time for logs to be emitted
	await page.waitForTimeout(1500).catch(() => {});
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
	// Wait a bit for notifications to fully render
	await page.waitForTimeout(1000);
	
	// Try multiple selectors as VS Code Web may use different structure
	const selectors = [
		'.notifications-list-container .notification-list-item-message',
		'.monaco-workbench .notifications-toasts .notification-toast-message',
		'.notifications-center .notification-list-item-message',
		'[role="alert"]',
		'.notification-list-item',
	];
	
	const messages: string[] = [];
	
	for (const selector of selectors) {
		const notifications = page.locator(selector);
		const count = await notifications.count();
		
		console.log(`Checking selector "${selector}": found ${count} notifications`);
		
		for (let i = 0; i < count; i++) {
			const text = await notifications.nth(i).textContent();
			if (text) {
				messages.push(text.trim());
				console.log(`  Notification ${i}: "${text.trim()}"`);
			}
		}
		
		if (messages.length > 0) {
			break; // Found some notifications, stop trying other selectors
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
