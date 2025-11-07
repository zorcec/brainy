/**
 * Module: e2e/fixtures/vscode-desktop-fixtures.ts
 *
 * Description:
 *   Modular Playwright fixtures for VS Code Desktop E2E testing.
 *   Provides reusable setup/teardown for VS Code Desktop, CDP connection, and page.
 *   Enables parallel test execution with isolated VS Code Desktop instances.
 *   Reduces code duplication and improves test maintainability.
 *
 * Usage:
 *   import { test, expect } from './fixtures/vscode-desktop-fixtures';
 *   test('my test', async ({ vscodeServer, vscPage }) => {
 *     await vscPage.openFile('sample.md');
 *   });
 */

import { test as base, expect, Page, Browser, chromium } from '@playwright/test';
import { VSCodeDesktopServer } from '../vscode-desktop-server';
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
	/** Waits for a notification containing specific text */
	waitForNotification: (text: string, timeout?: number) => Promise<boolean>;
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
 * Worker-scoped fixtures (shared across tests in same worker)
 */
type VSCodeWorkerFixtures = {
	/** VS Code Desktop server instance (one per worker) */
	vscodeServer: VSCodeDesktopServer;
	/** Playwright browser connected to VS Code Desktop via CDP (one per worker) */
	vscodeBrowser: Browser;
};

/**
 * Test-scoped fixtures (unique per test)
 */
type VSCodeTestFixtures = {
	/** VS Code page with helper methods */
	vscPage: VSCodePage;
	/** Test start time for metrics */
	testStartTime: number;
};

/**
 * Extended test with VS Code fixtures
 */
export const test = base.extend<VSCodeTestFixtures, VSCodeWorkerFixtures>({
	/**
	 * Test start time fixture (auto-used by other fixtures)
	 */
	testStartTime: async ({}, use) => {
		const startTime = Date.now();
		await use(startTime);
	},

	/**
	 * VS Code Desktop server fixture (worker-scoped)
	 * Starts one VS Code Desktop instance per worker and reuses it across all tests
	 * This dramatically improves performance by avoiding redundant server startups
	 */
	vscodeServer: [async ({}, use, workerInfo) => {
		const startTime = Date.now();
		const server = new VSCodeDesktopServer();
		await server.start();
		
		const setupTime = Date.now() - startTime;
		console.log(`[Worker ${workerInfo.workerIndex}] VS Code Desktop server setup completed in ${setupTime}ms`);
		
		await use(server);
		
		// Cleanup: stop server after all tests in this worker complete
		const metrics = server.getMetrics();
		if (metrics) {
			console.log(`[Worker ${workerInfo.workerIndex}] Server metrics: ${JSON.stringify(metrics)}`);
		}
		await server.stop();
	}, { scope: 'worker' }],

	/**
	 * Playwright browser connected to VS Code Desktop via CDP (worker-scoped)
	 * Connects once per worker and reuses the connection across all tests
	 */
	vscodeBrowser: [async ({ vscodeServer }, use, workerInfo) => {
		const cdpUrl = vscodeServer.getCdpUrl();
		if (!cdpUrl) {
			throw new Error('VS Code Desktop CDP URL not available');
		}

		console.log(`[Worker ${workerInfo.workerIndex}] Connecting Playwright to VS Code Desktop via CDP: ${cdpUrl}`);
		
		// Connect to VS Code Desktop via Chrome DevTools Protocol
		const browser = await chromium.connectOverCDP(cdpUrl);
		console.log(`[Worker ${workerInfo.workerIndex}] Connected to VS Code Desktop`);
		
		await use(browser);
		
		// Cleanup: close browser connection after all tests in this worker complete
		console.log(`[Worker ${workerInfo.workerIndex}] Closing browser connection`);
		await browser.close();
	}, { scope: 'worker' }],

	/**
	 * VS Code page fixture with helper methods (test-scoped)
	 * Reuses the shared VS Code Desktop and browser connection from the worker
	 * Creates a new page for each test for isolation
	 */
	vscPage: async ({ vscodeBrowser, testStartTime }, use, testInfo) => {
		// Get the first context (VS Code Desktop creates a default context)
		const contexts = vscodeBrowser.contexts();
		if (contexts.length === 0) {
			throw new Error('No browser contexts available in VS Code Desktop');
		}
		const context = contexts[0];

		// Get or create a page
		let page: Page;
		const pages = context.pages();
		if (pages.length > 0) {
			page = pages[0];
			console.log(`[${testInfo.title}] Reusing existing page`);
		} else {
			page = await context.newPage();
			console.log(`[${testInfo.title}] Created new page`);
		}
		
		// Wait for workbench to load
		await helpers.waitForWorkbench(page);
		
		const setupTime = Date.now() - testStartTime;
		console.log(`[${testInfo.title}] Test setup completed in ${setupTime}ms`);

		// Create extended page with helper methods
		const vscPage: VSCodePage = {
			page,
			openFile: (filename: string) => helpers.openFile(page, filename),
			isPlayButtonVisible: () => helpers.isPlayButtonVisible(page),
			clickPlayButton: () => helpers.clickPlayButton(page),
			captureConsoleLogs: (action: () => Promise<void>) => helpers.captureConsoleLogs(page, action),
			getNotifications: () => helpers.getNotifications(page),
			waitForNotification: (text: string, timeout?: number) => helpers.waitForNotification(page, text, timeout),
			isFileOpen: (filename: string) => helpers.isFileOpen(page, filename),
			getEditorContent: () => helpers.getEditorContent(page),
			hasErrorDecorations: () => helpers.hasErrorDecorations(page),
			getHoverTooltip: (lineNumber: number) => helpers.getHoverTooltip(page, lineNumber),
			hasCodeLensDecorations: () => helpers.hasCodeLensDecorations(page),
		};

		await use(vscPage);
		
		// Cleanup: log test duration (page is reused, not closed)
		const testDuration = Date.now() - testStartTime;
		console.log(`[${testInfo.title}] Test total duration: ${testDuration}ms`);
	},
});

export { expect };
