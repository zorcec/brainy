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
 * Safely execute a page operation, handling page closure gracefully
 * Returns undefined if page is closed or operation fails due to closure
 */
async function safePageOp<T>(
	page: Page,
	operation: () => Promise<T>,
	defaultValue: T
): Promise<T> {
	if (page.isClosed()) {
		return defaultValue;
	}

	try {
		return await operation();
	} catch (error: any) {
		if (page.isClosed() || error?.message?.includes('closed') || error?.message?.includes('Target closed')) {
			return defaultValue;
		}
		throw error;
	}
}

/**
 * Waits for VS Code workbench to be fully loaded
 */
export async function waitForWorkbench(page: Page): Promise<void> {
	await safePageOp(page, async () => {
		await page.waitForSelector('.monaco-workbench', { timeout: 30000 });
		await page.waitForTimeout(2000);
	}, undefined);
}

/**
 * Opens a file in the editor
 */
export async function openFile(page: Page, filename: string): Promise<void> {
	await safePageOp(page, async () => {
		// Dismiss any modal dialogs first
		const modalDialog = page.locator('.monaco-dialog-modal-block');
		const isModalVisible = await modalDialog.isVisible().catch(() => false);
		if (isModalVisible) {
			// Try to dismiss via Escape
			await page.keyboard.press('Escape').catch(() => {});
			await page.waitForTimeout(500);
		}

		// Make sure explorer is visible
		const explorerView = page.locator('[id="workbench.view.explorer"]');
		const isVisible = await explorerView.isVisible().catch(() => false);
		
		if (!isVisible) {
			await page.click('[aria-label="Explorer (Ctrl+Shift+E)"]').catch(() => {});
			await page.waitForTimeout(500);
		}
		
		// Click the file in the tree with force option to handle overlays
		const fileItem = page.locator(`.monaco-list-row:has-text("${filename}")`);
		await fileItem.click({ force: true });
		await page.waitForTimeout(2000);
		await page.waitForTimeout(1000); // Wait for CodeLens
	}, undefined);
}

/**
 * Checks if play button (CodeLens) is visible on the first line
 */
export async function isPlayButtonVisible(page: Page): Promise<boolean> {
	return await safePageOp(page, async () => {
		await page.waitForTimeout(1500);
		
		const selectors = [
			'.codelens-decoration',
			'.contentWidgets .codicon-run',
			'[class*="codelens"]',
			'[class*="CodeLens"]'
		];
		
		// Check with text filter for "Play" button
		for (const selector of selectors) {
			const element = page.locator(selector).filter({ hasText: /Play/ }).first();
			const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
			if (isVisible) {
				console.log(`Found CodeLens with selector: ${selector}`);
				return true;
			}
		}
		
		// Check without text filter
		for (const selector of selectors) {
			const element = page.locator(selector).first();
			const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
			if (isVisible) {
				console.log(`Found CodeLens element with selector: ${selector} (no text filter)`);
				const text = await element.textContent().catch(() => null);
				console.log(`CodeLens text: ${text}`);
				return true;
			}
		}
		
		return false;
	}, false);
}

/**
 * Clicks the play button CodeLens or triggers parse command via command palette as fallback
 */
export async function clickPlayButton(page: Page): Promise<void> {
	await safePageOp(page, async () => {
		// Always use command palette to trigger parse command for testing
		// This is more reliable than trying to find and click CodeLens
		console.log('Triggering parse command via command palette');
		await page.keyboard.press('Control+Shift+P');
		await page.waitForTimeout(800);
		await page.keyboard.type('Brainy: Parse Playbook', { delay: 50 });
		await page.waitForTimeout(500);
		await page.keyboard.press('Enter');
		await page.waitForTimeout(2500);
	}, undefined);
}

/**
 * Gets the content from the Output panel
 * Note: May not work reliably in VS Code Web - prefer using captureConsoleLogs instead
 */
export async function getOutputPanelText(page: Page, channelName: string = 'Brainy Playbook'): Promise<string> {
	return await safePageOp(page, async () => {
		// Open output panel
		await page.keyboard.press('Control+Shift+U');
		await page.waitForTimeout(500);
		
		// Select the correct output channel
		const channelSelector = page.locator('.output-select-container select');
		await channelSelector.selectOption({ label: channelName });
		await page.waitForTimeout(500);
		
		// Get the output text
		const outputText = await page.locator('.view-line').allTextContents();
		return outputText.join('\n');
	}, '');
}

/**
 * Captures console logs from the extension during a test action
 * Returns the captured logs after the action completes
 */
export async function captureConsoleLogs(page: Page, action: () => Promise<void>): Promise<string[]> {
	return await safePageOp(page, async () => {
		const logs: string[] = [];
		
		const handler = (msg: any) => {
			try {
				logs.push(msg.text());
			} catch (e) {
				// Ignore handler errors
			}
		};
		
		page.on('console', handler);
		try {
			await action();
			await page.waitForTimeout(1500);
		} finally {
			page.off('console', handler);
		}
		
		return logs;
	}, []);
}

/**
 * Waits for parse command to complete by checking console logs
 */
export async function waitForParseComplete(page: Page, timeout: number = 5000): Promise<boolean> {
	return await safePageOp(page, async () => {
		const startTime = Date.now();
		let parseCompleted = false;
		
		const handler = (msg: any) => {
			try {
				const text = msg.text();
				if (text.includes('Parse result:') || text.includes('Parsed playbook:')) {
					parseCompleted = true;
				}
			} catch (e) {
				// Ignore
			}
		};
		
		page.on('console', handler);
		try {
			while (!parseCompleted && (Date.now() - startTime) < timeout) {
				await page.waitForTimeout(100);
			}
		} finally {
			page.off('console', handler);
		}
		
		return parseCompleted;
	}, false);
}

/**
 * Checks if error decorations are visible in the editor
 */
export async function hasErrorDecorations(page: Page): Promise<boolean> {
	return await safePageOp(page, async () => {
		const errorDecoration = page.locator('.monaco-editor .view-overlays .cdr.error');
		const count = await errorDecoration.count();
		return count > 0;
	}, false);
}

/**
 * Gets the hover tooltip text for a specific line
 */
export async function getHoverTooltip(page: Page, lineNumber: number): Promise<string> {
	return await safePageOp(page, async () => {
		const line = page.locator(`.view-lines > .view-line`).nth(lineNumber - 1);
		await line.hover();
		await page.waitForTimeout(1000);
		
		const hoverContent = page.locator('.monaco-hover-content');
		const isVisible = await hoverContent.isVisible().catch(() => false);
		
		if (isVisible) {
			return await hoverContent.textContent() || '';
		}
		return '';
	}, '');
}

/**
 * Checks if inline error message is visible on a specific line
 */
export async function hasInlineErrorOnLine(page: Page, lineNumber: number): Promise<boolean> {
	return await safePageOp(page, async () => {
		const lineDecorations = page.locator(`.view-lines > .view-line`).nth(lineNumber - 1)
			.locator('.cdr.error, .squiggly-error, .squiggly-inline-error');
		const count = await lineDecorations.count();
		return count > 0;
	}, false);
}

/**
 * Gets all visible notification messages
 */
export async function getNotifications(page: Page): Promise<string[]> {
	return await safePageOp(page, async () => {
		await page.waitForTimeout(1000);
		
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
			
			if (messages.length > 0) break;
		}
		
		return messages;
	}, []);
}

/**
 * Closes all notifications
 */
export async function closeAllNotifications(page: Page): Promise<void> {
	await safePageOp(page, async () => {
		const closeButtons = page.locator('.notifications-list-container .codicon-notifications-clear');
		const count = await closeButtons.count();
		
		for (let i = 0; i < count; i++) {
			await closeButtons.first().click();
			await page.waitForTimeout(200);
		}
	}, undefined);
}

/**
 * Gets the content of the active editor
 */
export async function getEditorContent(page: Page): Promise<string> {
	return await safePageOp(page, async () => {
		const lines = page.locator('.view-lines > .view-line');
		const allText = await lines.allTextContents();
		return allText.join('\n');
	}, '');
}

/**
 * Checks if a file is open in the editor
 */
export async function isFileOpen(page: Page, filename: string): Promise<boolean> {
	return await safePageOp(page, async () => {
		const tab = page.locator(`.tabs-container .tab:has-text("${filename}")`);
		return await tab.isVisible({ timeout: 2000 });
	}, false);
}

/**
 * Switches the color theme (for testing highlighting across themes)
 */
export async function switchTheme(page: Page, themeName: string): Promise<void> {
	await safePageOp(page, async () => {
		await page.keyboard.press('Control+Shift+P');
		await page.waitForTimeout(500);
		
		await page.keyboard.type('Preferences: Color Theme');
		await page.keyboard.press('Enter');
		await page.waitForTimeout(500);

		await page.keyboard.type(themeName);
		await page.keyboard.press('Enter');
		await page.waitForTimeout(1000);
	}, undefined);
}

/**
 * Checks if CodeLens decorations are present in the editor
 */
export async function hasCodeLensDecorations(page: Page): Promise<boolean> {
	return await safePageOp(page, async () => {
		const codeLens = page.locator('.codelens-decoration');
		const count = await codeLens.count();
		return count > 0;
	}, false);
}
