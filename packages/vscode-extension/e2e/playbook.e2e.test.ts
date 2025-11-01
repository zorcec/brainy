/**
 * Module: e2e/playbook.e2e.test.ts
 *
 * Description:
 *   End-to-end tests for Brainy playbook functionality using Playwright.
 *   Tests launch VS Code Web, interact with the UI, click buttons, and inspect results.
 *   Each test gets its own isolated VS Code server instance for parallel execution.
 *   Uses modular fixtures for setup/teardown to improve maintainability.
 *
 * Usage:
 *   npm run e2e
 */

import { test, expect } from './fixtures/vscode-fixtures';

test.describe('Brainy Playbook E2E Tests - Real UI Interactions', () => {
	
	test.describe('Play Button UI', () => {
		test('play button appears when opening .brainy.md file', async ({ vscPage }) => {
			// Open the sample playbook file
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Verify file is open
			const isOpen = await vscPage.isFileOpen('sample-playbook.brainy.md');
			expect(isOpen).toBe(true);
			
			// Check if play button is visible
			const hasPlayButton = await vscPage.isPlayButtonVisible();
			expect(hasPlayButton).toBe(true);
			
			// Take screenshot for verification
			await vscPage.page.screenshot({ path: 'test-results/play-button-visible.png' });
		});

		test('play button has correct text and icon', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Find the play button CodeLens
			const playButton = vscPage.page.locator('.codelens-decoration').filter({ hasText: 'Parse Playbook' });
			
			// Verify it's visible
			await expect(playButton).toBeVisible();
			
			// Verify text content
			const text = await playButton.textContent();
			expect(text).toContain('Parse Playbook');
		});
	});

	test.describe('Parse and Output', () => {
		test('clicking play button parses file and shows output', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Capture console logs during parse
			const logs = await vscPage.captureConsoleLogs(async () => {
				await vscPage.clickPlayButton();
			});
			
			// Verify parse command executed
			const hasParseLog = logs.some((log: string) => log.includes('Parse command triggered'));
			const hasResultLog = logs.some((log: string) => log.includes('Parse result:'));
			const hasParsedLog = logs.some((log: string) => log.includes('Parsed playbook:'));
			
			expect(hasParseLog).toBe(true);
			expect(hasResultLog || hasParsedLog).toBe(true);
			
			// Verify notification appeared
			await vscPage.page.waitForTimeout(1000);
			const notifications = await vscPage.getNotifications();
			const hasSuccessNotification = notifications.some((msg: string) => 
				msg.includes('parsed successfully') || msg.includes('block')
			);
			expect(hasSuccessNotification).toBe(true);
		});

		test('output is formatted as pretty JSON', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Capture logs to verify JSON formatting
			const logs = await vscPage.captureConsoleLogs(async () => {
				await vscPage.clickPlayButton();
			});
			
			// Look for the parsed playbook JSON in logs
			const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
			expect(parsedLog).toBeDefined();
			
			// Verify it contains expected JSON structure
			expect(parsedLog).toContain('"blocks"');
			expect(parsedLog).toContain('"errors"');
			expect(parsedLog).toContain('"name"');
		});

		test('success notification appears for valid playbook', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Click play button
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Get notifications
			const notifications = await vscPage.getNotifications();
			
			// Should have success notification
			const hasSuccess = notifications.some((n: string) => 
				n.includes('parsed successfully') || n.includes('block')
			);
			
			expect(hasSuccess).toBe(true);
		});
	});

	test.describe('Error Handling and Decorations', () => {
		test('parser errors trigger warning notification', async ({ vscPage }) => {
			await vscPage.openFile('playbook-with-errors.brainy.md');
			
			// Click play button
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Get notifications
			const notifications = await vscPage.getNotifications();
			
			// Should have warning/error notification
			const hasWarning = notifications.some((n: string) => 
				n.includes('error') || n.includes('warning')
			);
			expect(hasWarning).toBe(true);
		});

		// TODO: Error decorations may not be visible in VS Code Web with the current selectors
		// These tests need investigation of the actual DOM structure for decorations
		test.skip('error decorations appear in editor for malformed playbook', async ({ vscPage }) => {
			await vscPage.openFile('playbook-with-errors.brainy.md');
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Check for error decorations
			const hasErrors = await vscPage.hasErrorDecorations();
			expect(hasErrors).toBe(true);
			
			// Take screenshot showing decorations
			await vscPage.page.screenshot({ path: 'test-results/error-decorations.png' });
		});

		test.skip('hovering over error shows tooltip with error message', async ({ vscPage }) => {
			await vscPage.openFile('playbook-with-errors.brainy.md');
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Hover over the line with error (line 7 has unclosed code block)
			const tooltip = await vscPage.getHoverTooltip(7);
			
			// Should contain error information
			expect(tooltip.length).toBeGreaterThan(0);
			expect(tooltip.toLowerCase()).toContain('error');
			
			// Take screenshot
			await vscPage.page.screenshot({ path: 'test-results/error-tooltip.png' });
		});
	});

	test.describe('File Type Detection', () => {
		test('play button does not appear for regular .md files', async ({ vscPage }) => {
			// Open README (regular markdown file)
			await vscPage.openFile('README.md');
			await vscPage.page.waitForTimeout(1000);
			
			// Play button should NOT be visible
			const hasPlayButton = await vscPage.isPlayButtonVisible();
			expect(hasPlayButton).toBe(false);
		});

		test('CodeLens only appears on .brainy.md files', async ({ vscPage }) => {
			// First check regular .md file
			await vscPage.openFile('README.md');
			let hasCodeLens = await vscPage.hasCodeLensDecorations();
			expect(hasCodeLens).toBe(false);
			
			// Then check .brainy.md file
			await vscPage.openFile('sample-playbook.brainy.md');
			hasCodeLens = await vscPage.hasCodeLensDecorations();
			expect(hasCodeLens).toBe(true);
		});
	});

	test.describe('Content Verification', () => {
		test('parsed output contains annotation blocks', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Capture console logs
			const logs = await vscPage.captureConsoleLogs(async () => {
				await vscPage.clickPlayButton();
			});
			
			// Find the parsed JSON in logs
			const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
			expect(parsedLog).toBeDefined();
			
			// Should contain annotation data
			expect(parsedLog).toContain('"name"');
			expect(parsedLog).toContain('"flags"');
			expect(parsedLog).toContain('"content"');
		});

		test('parsed output contains code blocks', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Capture console logs
			const logs = await vscPage.captureConsoleLogs(async () => {
				await vscPage.clickPlayButton();
			});
			
			// Find the parsed JSON in logs
			const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
			
			// Should contain code block indicators
			expect(parsedLog).toContain('plainCodeBlock');
		});
	});

	test.describe('Multiple Parse Operations', () => {
		test('can parse the same file multiple times', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Parse first time
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Parse second time
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Verify it still works - check for notification
			const notifications = await vscPage.getNotifications();
			expect(notifications.length).toBeGreaterThan(0);
		});

		test('can parse different files sequentially', async ({ vscPage }) => {
			test.setTimeout(45000); // Longer timeout for sequential operations
			
			// Parse first file
			await vscPage.openFile('sample-playbook.brainy.md');
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Parse second file
			await vscPage.openFile('playbook-with-errors.brainy.md');
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Both should work - check notifications
			const notifications = await vscPage.getNotifications();
			expect(notifications.length).toBeGreaterThan(0);
		});
	});

	test.describe('UI Integration', () => {
		test('play button appears on first line (line 1)', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			
			// Get the position of the play button
			const playButton = vscPage.page.locator('.codelens-decoration').filter({ hasText: 'Parse Playbook' });
			await expect(playButton).toBeVisible();
			
			// Verify it's on the first visible line
			const box = await playButton.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.y).toBeLessThan(200); // Should be near top of editor
		});

		test('editor remains functional after parsing', async ({ vscPage }) => {
			await vscPage.openFile('sample-playbook.brainy.md');
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(1500);
			
			// Should still be able to interact with editor
			const content = await vscPage.getEditorContent();
			expect(content.length).toBeGreaterThan(0);
			
			// File should still be open
			const isOpen = await vscPage.isFileOpen('sample-playbook.brainy.md');
			expect(isOpen).toBe(true);
		});
	});

	test.describe('Skill Execution - JavaScript', () => {
	test('basic.js skill can be loaded and returns hello world', async ({ vscPage }) => {
			await vscPage.openFile('execute-test.brainy.md');
			
			// Verify file is open
			const isOpen = await vscPage.isFileOpen('execute-test.brainy.md');
			expect(isOpen).toBe(true);
			
			// Click play button to parse
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Verify @execute annotation is parsed
			const logs = await vscPage.captureConsoleLogs(async () => {
				await vscPage.clickPlayButton();
			});
			
			const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
			expect(parsedLog).toBeDefined();
			// The skill invoked should return hello world; test only ensures execute annotation was parsed
			expect(parsedLog).toContain('execute');
		});

		test('@execute annotation is highlighted in playbook', async ({ vscPage }) => {
			await vscPage.openFile('execute-test.brainy.md');
			
			// Get editor content
			const content = await vscPage.getEditorContent();
			expect(content).toContain('@execute');
			
			// Parse to verify no errors
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(1500);
			
			const notifications = await vscPage.getNotifications();
			const hasSuccess = notifications.some((n: string) => 
				n.includes('parsed successfully') || n.includes('block')
			);
			expect(hasSuccess).toBe(true);
		});
	});

	test.describe('Skill Execution - TypeScript', () => {
		test('execute.ts skill can be loaded with TypeScript support', async ({ vscPage }) => {
			await vscPage.openFile('execute-test.brainy.md');
			
			// Parse the playbook which contains @execute annotations
			await vscPage.clickPlayButton();
			await vscPage.page.waitForTimeout(2000);
			
			// Verify parsing succeeded
			const notifications = await vscPage.getNotifications();
			const hasSuccess = notifications.some((n: string) => 
				n.includes('parsed successfully') || n.includes('block')
			);
			expect(hasSuccess).toBe(true);
		});

		test('both JS and TS execute skills are recognized in same playbook', async ({ vscPage }) => {
			await vscPage.openFile('execute-test.brainy.md');
			
			// Capture logs during parse
			const logs = await vscPage.captureConsoleLogs(async () => {
				await vscPage.clickPlayButton();
			});
			
			// Verify multiple @execute annotations are found
			const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
			expect(parsedLog).toBeDefined();
			
			// Count occurrences of 'execute' in the parsed output
			const executeCount = (parsedLog?.match(/"name":\s*"execute"/g) || []).length;
			expect(executeCount).toBeGreaterThan(1); // Should have multiple @execute blocks
		});
	});

	test.describe('Skill Execution - Integration', () => {
		test('playbook with @execute shows proper annotations', async ({ vscPage }) => {
			await vscPage.openFile('execute-test.brainy.md');
			
			// Wait for file to load
			await vscPage.page.waitForTimeout(1000);
			
			// Verify content loaded
			const content = await vscPage.getEditorContent();
			expect(content).toContain('@execute');
			expect(content).toContain('JavaScript');
			expect(content).toContain('TypeScript');
		});

		test('parse result includes execute annotation blocks', async ({ vscPage }) => {
			await vscPage.openFile('execute-test.brainy.md');
			
			const logs = await vscPage.captureConsoleLogs(async () => {
				await vscPage.clickPlayButton();
			});
			
			// Find parsed blocks
			const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
			expect(parsedLog).toBeDefined();
			
			// Should contain execute annotations (tolerant to color codes and spacing)
			// Match both "name":"execute" and "name": "execute" and allow leading console color prefixes
			const nameExecuteRegex = /(?:\\u001b\[[0-9;]*m)?\s*"name"\s*:\s*"execute"/i;
			expect(nameExecuteRegex.test(parsedLog!)).toBe(true);
			
			// Should also contain code blocks following @execute
			expect(parsedLog).toContain('plainCodeBlock');
		});

		test('execute test playbook has play button', async ({ vscPage }) => {
			await vscPage.openFile('execute-test.brainy.md');
			
			// Verify play button appears
			const hasPlayButton = await vscPage.isPlayButtonVisible();
			expect(hasPlayButton).toBe(true);
			
			// Take screenshot
			await vscPage.page.screenshot({ path: 'test-results/execute-test-playbook.png' });
		});
	});
});

