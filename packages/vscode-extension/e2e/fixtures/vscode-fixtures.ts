/**
 * Module: e2e/fixtures/vscode-fixtures.ts
 *
 * Description:
 *   Modular Playwright fixtures for VS Code Web E2E testing.
 *   Provides reusable setup/teardown for VS Code server, browser context, and page.
 *   Enables parallel test execution with isolated VS Code instances.
 *   Reduces code duplication and improves test maintainability.
 *
 * Usage:
 *   import { test, expect } from './fixtures/vscode-fixtures';
 *   test('my test', async ({ vscodeServer, vscPage }) => {
 *     await vscPage.openFile('sample.md');
 *   });
 */

import { test as base, expect, Page, Browser, BrowserContext } from '@playwright/test';
import { VSCodeWebServer } from '../vscode-web-server';
import * as helpers from '../helpers/vscode-page-helpers';

/**
 * Extended VS Code page with helper methods
 */
export interface VSCodePage {
	/** Playwright page instance */
	page: Page;
	/** Opens a file in the editor */
	openFile: (filename: string) => Promise<void>;
	/** Checks if play button is visible */
	isPlayButtonVisible: () => Promise<boolean>;
	/** Clicks the play button */
	clickPlayButton: () => Promise<void>;
	/** Captures console logs during an action */
	captureConsoleLogs: (action: () => Promise<void>) => Promise<string[]>;
	/** Gets notification messages */
	getNotifications: () => Promise<string[]>;
	/** Checks if file is open */
	isFileOpen: (filename: string) => Promise<boolean>;
	/** Gets editor content */
	getEditorContent: () => Promise<string>;
	/** Checks for error decorations */
	hasErrorDecorations: () => Promise<boolean>;
	/** Gets hover tooltip for a line */
	getHoverTooltip: (lineNumber: number) => Promise<string>;
	/** Checks for CodeLens decorations */
	hasCodeLensDecorations: () => Promise<boolean>;
}

/**
 * Fixtures for VS Code Web E2E testing
 */
type VSCodeFixtures = {
	/** VS Code Web server instance (auto-started and stopped) */
	vscodeServer: VSCodeWebServer;
	/** Browser context for this test */
	vscodeContext: BrowserContext;
	/** VS Code page with helper methods */
	vscPage: VSCodePage;
	/** Test start time for metrics */
	testStartTime: number;
};

/**
 * Extended test with VS Code fixtures
 */
export const test = base.extend<VSCodeFixtures>({
	/**
	 * Test start time fixture (auto-used by other fixtures)
	 */
	testStartTime: async ({}, use) => {
		const startTime = Date.now();
		await use(startTime);
	},

	/**
	 * VS Code server fixture
	 * Automatically starts a new VS Code server for each test
	 * and stops it after the test completes
	 */
	vscodeServer: async ({ testStartTime }, use) => {
		const server = new VSCodeWebServer();
		await server.start();
		
		const setupTime = Date.now() - testStartTime;
		console.log(`VS Code server setup completed in ${setupTime}ms`);
		
		await use(server);
		
		// Cleanup: stop server
		const metrics = server.getMetrics();
		if (metrics) {
			console.log(`Server metrics: ${JSON.stringify(metrics)}`);
		}
		await server.stop();
	},

	/**
	 * Browser context fixture
	 * Creates a new browser context for each test
	 * using the shared browser from the worker
	 */
	vscodeContext: async ({ browser, vscodeServer }, use) => {
		// Create a new browser context (lightweight) for this test
		const browserContext = await browser.newContext();
		
		await use(browserContext);
		
		// Cleanup: close context
		await browserContext.close();
	},

	/**
	 * VS Code page fixture with helper methods
	 * Creates a new page and navigates to VS Code Web
	 * Wraps the page with convenient helper methods
	 */
	vscPage: async ({ vscodeContext, vscodeServer, testStartTime }, use, testInfo) => {
		// Get VS Code URL from server
		const vscodeUrl = vscodeServer.getUrl();
		if (!vscodeUrl) {
			throw new Error('VS Code server URL not available');
		}

		// Create a new page within the context
		const page = await vscodeContext.newPage();
		await page.goto(vscodeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
		
		// Wait for workbench to load
		await helpers.waitForWorkbench(page);
		
		const setupTime = Date.now() - testStartTime;
		console.log(`Test setup completed in ${setupTime}ms`);

		// Create extended page with helper methods
		const vscPage: VSCodePage = {
			page,
			openFile: (filename: string) => helpers.openFile(page, filename),
			isPlayButtonVisible: () => helpers.isPlayButtonVisible(page),
			clickPlayButton: () => helpers.clickPlayButton(page),
			captureConsoleLogs: (action: () => Promise<void>) => helpers.captureConsoleLogs(page, action),
			getNotifications: () => helpers.getNotifications(page),
			isFileOpen: (filename: string) => helpers.isFileOpen(page, filename),
			getEditorContent: () => helpers.getEditorContent(page),
			hasErrorDecorations: () => helpers.hasErrorDecorations(page),
			getHoverTooltip: (lineNumber: number) => helpers.getHoverTooltip(page, lineNumber),
			hasCodeLensDecorations: () => helpers.hasCodeLensDecorations(page),
		};

		await use(vscPage);
		
		// Cleanup: close page and log test duration
		const testDuration = Date.now() - testStartTime;
		console.log(`Test "${testInfo.title}" total duration: ${testDuration}ms`);
		await page.close();
	},
});

/**
 * Re-export expect for convenience
 */
export { expect };
