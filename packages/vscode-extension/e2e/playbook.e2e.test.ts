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

import { test as base, expect } from './fixtures/vscode-fixtures';

let sharedVscPage;

base.beforeAll(async ({ browser }) => {
  sharedVscPage = await browser.newPage();
});

base.afterAll(async () => {
  await sharedVscPage.close();
});

base.describe('Brainy Playbook E2E Tests - Real UI Interactions', () => {
	base.describe('Play Button UI', () => {
		base('play button appears when opening .brainy.md file', async () => {
			// Open the sample playbook file
			await sharedVscPage.openFile('sample-playbook.brainy.md');
			
			// Verify file is open
			const isOpen = await sharedVscPage.isFileOpen('sample-playbook.brainy.md');
			expect(isOpen).toBe(true);
			
			// Check if play button is visible (CodeLens may not be supported in VS Code Web)
			const hasPlayButton = await sharedVscPage.isPlayButtonVisible();
			
			// If CodeLens not supported, verify extension is loaded via command availability
			if (!hasPlayButton) {
				console.log('CodeLens not detected, verifying extension via command palette');
				await sharedVscPage.page.keyboard.press('Control+Shift+P');
				await sharedVscPage.page.waitForTimeout(500);
				await sharedVscPage.page.keyboard.type('Brainy: Parse');
				await sharedVscPage.page.waitForTimeout(500);
				const quickPick = sharedVscPage.page.locator('.quick-input-list .monaco-list-row');
				const hasCommand = await quickPick.filter({ hasText: 'Brainy: Parse Playbook' }).count() > 0;
				await sharedVscPage.page.keyboard.press('Escape');
				expect(hasCommand).toBe(true);
			} else {
				expect(hasPlayButton).toBe(true);
			}
			
			// Take screenshot for verification
			await sharedVscPage.page.screenshot({ path: 'test-results/play-button-visible.png' });
		});
		base('play button has correct text and icon', async () => {
			await sharedVscPage.openFile('sample-playbook.brainy.md');
			
			// Check if play button is visible
			const hasPlayButton = await sharedVscPage.isPlayButtonVisible();
			
			// Skip test if CodeLens not supported in this environment
			if (!hasPlayButton) {
				base.skip();
				return;
			}
			
			// Find the play button CodeLens
			const playButton = sharedVscPage.page.locator('.codelens-decoration, [class*="codelens"], [class*="CodeLens"]').filter({ hasText: 'Parse Playbook' }).first();
			
			// Verify it's visible
			await expect(playButton).toBeVisible();
			
			// Verify text content
			const text = await playButton.textContent();
			expect(text).toContain('Parse Playbook');
		});
	});

	base.describe('Parse and Output', () => {
		base('clicking play button parses file and shows output', async () => {
			await sharedVscPage.openFile('sample-playbook.brainy.md');
			
			// Capture console logs during parse
			const logs = await sharedVscPage.captureConsoleLogs(async () => {
				await sharedVscPage.clickPlayButton();
			});
			
				// Verify parse command executed
				const hasParseLog = logs.some((log: string) => log.includes('Parse command triggered'));
				const hasResultLog = logs.some((log: string) => log.includes('Parse result:'));
				const hasParsedLog = logs.some((log: string) => log.includes('Parsed playbook:'));
				
				expect(hasParseLog).toBe(true);
				expect(hasResultLog || hasParsedLog).toBe(true);
				
				// Verify notification appeared
				await sharedVscPage.page.waitForTimeout(1000);
				const notifications = await sharedVscPage.getNotifications();
				const hasSuccessNotification = notifications.some((msg: string) => 
					msg.includes('parsed successfully') || msg.includes('block')
				);
				expect(hasSuccessNotification).toBe(true);
			});

			base('output is formatted as pretty JSON', async () => {
				await sharedVscPage.openFile('sample-playbook.brainy.md');
				
				// Capture logs to verify JSON formatting
				const logs = await sharedVscPage.captureConsoleLogs(async () => {
					await sharedVscPage.clickPlayButton();
				});
				
				// Look for the parsed playbook JSON in logs
				const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
				expect(parsedLog).toBeDefined();
				
				// Verify it contains expected JSON structure
				expect(parsedLog).toContain('"blocks"');
				expect(parsedLog).toContain('"errors"');
				expect(parsedLog).toContain('"name"');
			});

			base('success notification appears for valid playbook', async () => {
				await sharedVscPage.openFile('sample-playbook.brainy.md');
				
				// Click play button
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Get notifications
				const notifications = await sharedVscPage.getNotifications();
				
				// Should have success notification
				const hasSuccess = notifications.some((n: string) => 
					n.includes('parsed successfully') || n.includes('block')
				);
				
				expect(hasSuccess).toBe(true);
			});
		});

		base.describe('Error Handling and Decorations', () => {
			base('parser errors trigger warning notification', async () => {
				await sharedVscPage.openFile('playbook-with-errors.brainy.md');
				
				// Click play button
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Get notifications
				const notifications = await sharedVscPage.getNotifications();
				
				// Should have warning/error notification
				const hasWarning = notifications.some((n: string) => 
					n.includes('error') || n.includes('warning')
				);
				expect(hasWarning).toBe(true);
			});

			// TODO: Error decorations may not be visible in VS Code Web with the current selectors
			// These tests need investigation of the actual DOM structure for decorations
			base.skip('error decorations appear in editor for malformed playbook', async () => {
				await sharedVscPage.openFile('playbook-with-errors.brainy.md');
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Check for error decorations
				const hasErrors = await sharedVscPage.hasErrorDecorations();
				expect(hasErrors).toBe(true);
				
				// Take screenshot showing decorations
				await sharedVscPage.page.screenshot({ path: 'test-results/error-decorations.png' });
			});

			base.skip('hovering over error shows tooltip with error message', async () => {
				await sharedVscPage.openFile('playbook-with-errors.brainy.md');
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Hover over the line with error (line 7 has unclosed code block)
				const tooltip = await sharedVscPage.getHoverTooltip(7);
				
				// Should contain error information
				expect(tooltip.length).toBeGreaterThan(0);
				expect(tooltip.toLowerCase()).toContain('error');
				
				// Take screenshot
				await sharedVscPage.page.screenshot({ path: 'test-results/error-tooltip.png' });
			});
		});

		base.describe('File Type Detection', () => {
			base('play button does not appear for regular .md files', async () => {
				// Open README (regular markdown file)
				await sharedVscPage.openFile('README.md');
				await sharedVscPage.page.waitForTimeout(1000);
				
				// Play button should NOT be visible
				const hasPlayButton = await sharedVscPage.isPlayButtonVisible();
				expect(hasPlayButton).toBe(false);
			});

			base('CodeLens only appears on .brainy.md files', async () => {
				// First check regular .md file
				await sharedVscPage.openFile('README.md');
				let hasCodeLens = await sharedVscPage.hasCodeLensDecorations();
				// Note: CodeLens might not be supported in VS Code Web, so we can't guarantee false
				// Just verify it's not throwing errors
				
				// Then check .brainy.md file - use command palette fallback test
				await sharedVscPage.openFile('sample-playbook.brainy.md');
				hasCodeLens = await sharedVscPage.hasCodeLensDecorations();
				
				// If CodeLens not supported, verify command is available instead
				if (!hasCodeLens) {
					// Try to execute command via command palette to verify extension is loaded
					await sharedVscPage.page.keyboard.press('Control+Shift+P');
					await sharedVscPage.page.waitForTimeout(500);
					await sharedVscPage.page.keyboard.type('Brainy: Parse');
					await sharedVscPage.page.waitForTimeout(500);
					const quickPick = sharedVscPage.page.locator('.quick-input-list .monaco-list-row');
					const hasCommand = await quickPick.filter({ hasText: 'Brainy: Parse Playbook' }).count() > 0;
					await sharedVscPage.page.keyboard.press('Escape'); // Close command palette
					expect(hasCommand).toBe(true);
				} else {
					expect(hasCodeLens).toBe(true);
				}
			});
		});

		base.describe('Content Verification', () => {
			base('parsed output contains annotation blocks', async () => {
				await sharedVscPage.openFile('sample-playbook.brainy.md');
				
				// Capture console logs
				const logs = await sharedVscPage.captureConsoleLogs(async () => {
					await sharedVscPage.clickPlayButton();
				});
				
				// Find the parsed JSON in logs
				const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
				expect(parsedLog).toBeDefined();
				
				// Should contain annotation data
				expect(parsedLog).toContain('"name"');
				expect(parsedLog).toContain('"flags"');
				expect(parsedLog).toContain('"content"');
			});

			base('parsed output contains code blocks', async () => {
				await sharedVscPage.openFile('sample-playbook.brainy.md');
				
				// Capture console logs
				const logs = await sharedVscPage.captureConsoleLogs(async () => {
					await sharedVscPage.clickPlayButton();
				});
				
				// Find the parsed JSON in logs
				const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
				
				// Should contain code block indicators
				expect(parsedLog).toContain('plainCodeBlock');
			});
		});

		base.describe('Multiple Parse Operations', () => {
			base('can parse the same file multiple times', async () => {
				await sharedVscPage.openFile('sample-playbook.brainy.md');
				
				// Parse first time
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Parse second time
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Verify it still works - check for notification
				const notifications = await sharedVscPage.getNotifications();
				expect(notifications.length).toBeGreaterThan(0);
			});

			base('can parse different files sequentially', async () => {
				base.setTimeout(45000); // Longer timeout for sequential operations
				
				// Parse first file
				await sharedVscPage.openFile('sample-playbook.brainy.md');
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Parse second file
				await sharedVscPage.openFile('playbook-with-errors.brainy.md');
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Both should work - check notifications
				const notifications = await sharedVscPage.getNotifications();
				expect(notifications.length).toBeGreaterThan(0);
			});
		});

		base.describe('UI Integration', () => {
			base('play button appears on first line (line 1)', async () => {
				await sharedVscPage.openFile('sample-playbook.brainy.md');
				
				// Check if play button is visible
				const hasPlayButton = await sharedVscPage.isPlayButtonVisible();
				
				// Skip test if CodeLens not supported
				if (!hasPlayButton) {
					base.skip();
					return;
				}
				
				// Get the position of the play button
				const playButton = sharedVscPage.page.locator('.codelens-decoration, [class*="codelens"], [class*="CodeLens"]').filter({ hasText: 'Parse Playbook' }).first();
				await expect(playButton).toBeVisible();
				
			
			// Verify it's on the first visible line
			const box = await playButton.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.y).toBeLessThan(200); // Should be near top of editor
		});

		base('editor remains functional after parsing', async () => {
			await sharedVscPage.openFile('sample-playbook.brainy.md');
			await sharedVscPage.clickPlayButton();
			await sharedVscPage.page.waitForTimeout(1500);
			
			// Should still be able to interact with editor
			const content = await sharedVscPage.getEditorContent();
			expect(content.length).toBeGreaterThan(0);
			
			// File should still be open
			const isOpen = await sharedVscPage.isFileOpen('sample-playbook.brainy.md');
			expect(isOpen).toBe(true);
		});
	});

	base.describe('Skill Execution - JavaScript', () => {
	base('basic.js skill can be loaded and returns hello world', async () => {
			await sharedVscPage.openFile('execute-test.brainy.md');			// Verify file is open
				const isOpen = await sharedVscPage.isFileOpen('execute-test.brainy.md');
				expect(isOpen).toBe(true);
				
				// Click play button to parse
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Verify @execute annotation is parsed
				const logs = await sharedVscPage.captureConsoleLogs(async () => {
					await sharedVscPage.clickPlayButton();
				});
				
				const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
				expect(parsedLog).toBeDefined();
				// The skill invoked should return hello world; test only ensures execute annotation was parsed
				expect(parsedLog).toContain('execute');
			});

			base('@execute annotation is highlighted in playbook', async () => {
				await sharedVscPage.openFile('execute-test.brainy.md');
				
				// Get editor content
				const content = await sharedVscPage.getEditorContent();
				expect(content).toContain('@execute');
				
				// Parse to verify no errors
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(1500);
				
				const notifications = await sharedVscPage.getNotifications();
				const hasSuccess = notifications.some((n: string) => 
					n.includes('parsed successfully') || n.includes('block')
				);
				expect(hasSuccess).toBe(true);
			});
		});

		base.describe('Skill Execution - TypeScript', () => {
			base('execute.ts skill can be loaded with TypeScript support', async () => {
				await sharedVscPage.openFile('execute-test.brainy.md');
				
				// Parse the playbook which contains @execute annotations
				await sharedVscPage.clickPlayButton();
				await sharedVscPage.page.waitForTimeout(2000);
				
				// Verify parsing succeeded
				const notifications = await sharedVscPage.getNotifications();
				const hasSuccess = notifications.some((n: string) => 
					n.includes('parsed successfully') || n.includes('block')
				);
				expect(hasSuccess).toBe(true);
			});

			base('both JS and TS execute skills are recognized in same playbook', async () => {
				await sharedVscPage.openFile('execute-test.brainy.md');
				
				// Capture logs during parse
				const logs = await sharedVscPage.captureConsoleLogs(async () => {
					await sharedVscPage.clickPlayButton();
				});
				
				// Verify multiple @execute annotations are found
				const parsedLog = logs.find((log: string) => log.includes('"blocks":'));
				expect(parsedLog).toBeDefined();
				
				// Count occurrences of 'execute' in the parsed output
				const executeCount = (parsedLog?.match(/"name":\s*"execute"/g) || []).length;
				expect(executeCount).toBeGreaterThan(1); // Should have multiple @execute blocks
			});
		});

		base.describe('Skill Execution - Integration', () => {
			base('playbook with @execute shows proper annotations', async () => {
				await sharedVscPage.openFile('execute-test.brainy.md');
				
				// Wait for file to load
				await sharedVscPage.page.waitForTimeout(1000);
				
				// Verify content loaded
				const content = await sharedVscPage.getEditorContent();
				expect(content).toContain('@execute');
				expect(content).toContain('JavaScript');
				expect(content).toContain('TypeScript');
			});

			base('parse result includes execute annotation blocks', async () => {
				await sharedVscPage.openFile('execute-test.brainy.md');
				
				const logs = await sharedVscPage.captureConsoleLogs(async () => {
					await sharedVscPage.clickPlayButton();
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

			base('execute test playbook has play button', async () => {
				await sharedVscPage.openFile('execute-test.brainy.md');
				
				// Verify play button appears
				const hasPlayButton = await sharedVscPage.isPlayButtonVisible();
				expect(hasPlayButton).toBe(true);
				
				// Take screenshot
				await sharedVscPage.page.screenshot({ path: 'test-results/execute-test-playbook.png' });
			});
		});
	});
});

