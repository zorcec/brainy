/**
 * Module: e2e/playbook.e2e.test.ts
 *
 * Description:
 *   End-to-end tests for Brainy playbook functionality using Playwright.
 *   Tests launch VS Code Web, interact with the UI, click buttons, and inspect results.
 *   Each test gets its own isolated VS Code server instance for parallel execution.
 *
 * Usage:
 *   npm run e2e
 */

import { test, expect, Page } from '@playwright/test';
import { VSCodeWebServer } from './vscode-web-server';
import * as helpers from './helpers/vscode-page-helpers';

test.describe('Brainy Playbook E2E Tests - Real UI Interactions', () => {
	let server: VSCodeWebServer;
	let page: Page;

	test.beforeEach(async ({ browser }) => {
		// Create a new VS Code server instance for this test
		server = new VSCodeWebServer();
		const vscodeUrl = await server.start();
		
		// Create a new page and navigate to VS Code
		page = await browser.newPage();
		await page.goto(vscodeUrl, { waitUntil: 'networkidle', timeout: 60000 });
		
		// Wait for workbench to load
		await helpers.waitForWorkbench(page);
	});

	test.afterEach(async () => {
		if (page) {
			await page.close();
		}
		if (server) {
			await server.stop();
		}
	});
	
	test.describe('Play Button UI', () => {
		test('play button appears when opening .brainy.md file', async () => {
			// Open the sample playbook file
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Verify file is open
			const isOpen = await helpers.isFileOpen(page, 'sample-playbook.brainy.md');
			expect(isOpen).toBe(true);
			
			// Check if play button is visible
			const hasPlayButton = await helpers.isPlayButtonVisible(page);
			expect(hasPlayButton).toBe(true);
			
			// Take screenshot for verification
			await page.screenshot({ path: 'test-results/play-button-visible.png' });
		});

		test('play button has correct text and icon', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Find the play button CodeLens
			const playButton = page.locator('.codelens-decoration').filter({ hasText: 'Parse Playbook' });
			
			// Verify it's visible
			await expect(playButton).toBeVisible();
			
			// Verify text content
			const text = await playButton.textContent();
			expect(text).toContain('Parse Playbook');
		});
	});

	test.describe('Parse and Output', () => {
		test('clicking play button parses file and shows output', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Capture console logs during parse
			const logs = await helpers.captureConsoleLogs(page, async () => {
				await helpers.clickPlayButton(page);
			});
			
			// Verify parse command executed
			const hasParseLog = logs.some(log => log.includes('Parse command triggered'));
			const hasResultLog = logs.some(log => log.includes('Parse result:'));
			const hasParsedLog = logs.some(log => log.includes('Parsed playbook:'));
			
			expect(hasParseLog).toBe(true);
			expect(hasResultLog || hasParsedLog).toBe(true);
			
			// Verify notification appeared
			await page.waitForTimeout(1000);
			const notifications = await helpers.getNotifications(page);
			const hasSuccessNotification = notifications.some(msg => 
				msg.includes('parsed successfully') || msg.includes('block')
			);
			expect(hasSuccessNotification).toBe(true);
		});

		test('output is formatted as pretty JSON', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Capture logs to verify JSON formatting
			const logs = await helpers.captureConsoleLogs(page, async () => {
				await helpers.clickPlayButton(page);
			});
			
			// Look for the parsed playbook JSON in logs
			const parsedLog = logs.find(log => log.includes('"blocks":'));
			expect(parsedLog).toBeDefined();
			
			// Verify it contains expected JSON structure
			expect(parsedLog).toContain('"blocks"');
			expect(parsedLog).toContain('"errors"');
			expect(parsedLog).toContain('"name"');
		});

		test('success notification appears for valid playbook', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Click play button
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(2000);
			
			// Get notifications
			const notifications = await helpers.getNotifications(page);
			
			// Should have success notification
			const hasSuccess = notifications.some(n => 
				n.includes('parsed successfully') || n.includes('block')
			);
			
			expect(hasSuccess).toBe(true);
		});
	});

	test.describe('Error Handling and Decorations', () => {
		test('parser errors trigger warning notification', async () => {
			await helpers.openFile(page, 'playbook-with-errors.brainy.md');
			
			// Click play button
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(2000);
			
			// Get notifications
			const notifications = await helpers.getNotifications(page);
			
			// Should have warning/error notification
			const hasWarning = notifications.some(n => 
				n.includes('error') || n.includes('warning')
			);
			expect(hasWarning).toBe(true);
		});

		// TODO: Error decorations may not be visible in VS Code Web with the current selectors
		// These tests need investigation of the actual DOM structure for decorations
		test.skip('error decorations appear in editor for malformed playbook', async () => {
			await helpers.openFile(page, 'playbook-with-errors.brainy.md');
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(2000);
			
			// Check for error decorations
			const hasErrors = await helpers.hasErrorDecorations(page);
			expect(hasErrors).toBe(true);
			
			// Take screenshot showing decorations
			await page.screenshot({ path: 'test-results/error-decorations.png' });
		});

		test.skip('hovering over error shows tooltip with error message', async () => {
			await helpers.openFile(page, 'playbook-with-errors.brainy.md');
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(2000);
			
			// Hover over the line with error (line 7 has unclosed code block)
			const tooltip = await helpers.getHoverTooltip(page, 7);
			
			// Should contain error information
			expect(tooltip.length).toBeGreaterThan(0);
			expect(tooltip.toLowerCase()).toContain('error');
			
			// Take screenshot
			await page.screenshot({ path: 'test-results/error-tooltip.png' });
		});
	});

	test.describe('File Type Detection', () => {
		test('play button does not appear for regular .md files', async () => {
			// Open README (regular markdown file)
			await helpers.openFile(page, 'README.md');
			await page.waitForTimeout(1000);
			
			// Play button should NOT be visible
			const hasPlayButton = await helpers.isPlayButtonVisible(page);
			expect(hasPlayButton).toBe(false);
		});

		test('CodeLens only appears on .brainy.md files', async () => {
			// First check regular .md file
			await helpers.openFile(page, 'README.md');
			let hasCodeLens = await helpers.hasCodeLensDecorations(page);
			expect(hasCodeLens).toBe(false);
			
			// Then check .brainy.md file
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			hasCodeLens = await helpers.hasCodeLensDecorations(page);
			expect(hasCodeLens).toBe(true);
		});
	});

	test.describe('Content Verification', () => {
		test('parsed output contains annotation blocks', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Capture console logs
			const logs = await helpers.captureConsoleLogs(page, async () => {
				await helpers.clickPlayButton(page);
			});
			
			// Find the parsed JSON in logs
			const parsedLog = logs.find(log => log.includes('"blocks":'));
			expect(parsedLog).toBeDefined();
			
			// Should contain annotation data
			expect(parsedLog).toContain('"name"');
			expect(parsedLog).toContain('"flags"');
			expect(parsedLog).toContain('"content"');
		});

		test('parsed output contains code blocks', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Capture console logs
			const logs = await helpers.captureConsoleLogs(page, async () => {
				await helpers.clickPlayButton(page);
			});
			
			// Find the parsed JSON in logs
			const parsedLog = logs.find(log => log.includes('"blocks":'));
			
			// Should contain code block indicators
			expect(parsedLog).toContain('plainCodeBlock');
		});
	});

	test.describe('Multiple Parse Operations', () => {
		test('can parse the same file multiple times', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Parse first time
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(2000);
			
			// Parse second time
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(2000);
			
			// Verify it still works - check for notification
			const notifications = await helpers.getNotifications(page);
			expect(notifications.length).toBeGreaterThan(0);
		});

		test('can parse different files sequentially', async () => {
			test.setTimeout(45000); // Longer timeout for sequential operations
			
			// Parse first file
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(2000);
			
			// Parse second file
			await helpers.openFile(page, 'playbook-with-errors.brainy.md');
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(2000);
			
			// Both should work - check notifications
			const notifications = await helpers.getNotifications(page);
			expect(notifications.length).toBeGreaterThan(0);
		});
	});

	test.describe('UI Integration', () => {
		test('play button appears on first line (line 1)', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			
			// Get the position of the play button
			const playButton = page.locator('.codelens-decoration').filter({ hasText: 'Parse Playbook' });
			await expect(playButton).toBeVisible();
			
			// Verify it's on the first visible line
			const box = await playButton.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.y).toBeLessThan(200); // Should be near top of editor
		});

		test('editor remains functional after parsing', async () => {
			await helpers.openFile(page, 'sample-playbook.brainy.md');
			await helpers.clickPlayButton(page);
			await page.waitForTimeout(1500);
			
			// Should still be able to interact with editor
			const content = await helpers.getEditorContent(page);
			expect(content.length).toBeGreaterThan(0);
			
			// File should still be open
			const isOpen = await helpers.isFileOpen(page, 'sample-playbook.brainy.md');
			expect(isOpen).toBe(true);
		});
	});
});
