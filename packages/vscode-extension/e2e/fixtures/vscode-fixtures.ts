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
 * Worker-scoped fixtures (shared across tests in same worker)
 */
type VSCodeWorkerFixtures = {
	/** VS Code Web server instance (one per worker) */
	vscodeServer: VSCodeWebServer;
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
	 * VS Code server fixture (worker-scoped)
	 * Starts one VS Code server per worker and reuses it across all tests
	 * This dramatically improves performance by avoiding redundant server startups
	 */
	vscodeServer: [async ({}, use, workerInfo) => {
		const startTime = Date.now();
		const server = new VSCodeWebServer();
		await server.start();
		
		const setupTime = Date.now() - startTime;
		console.log(`[Worker ${workerInfo.workerIndex}] VS Code server setup completed in ${setupTime}ms`);
		
		await use(server);
		
		// Cleanup: stop server after all tests in this worker complete
		const metrics = server.getMetrics();
		if (metrics) {
			console.log(`[Worker ${workerInfo.workerIndex}] Server metrics: ${JSON.stringify(metrics)}`);
		}
		await server.stop();
	}, { scope: 'worker' }],

	/**
	 * VS Code page fixture with helper methods (test-scoped)
	 * Reuses the shared VS Code server from the worker
	 * Navigates to a clean starting page before each test
	 */
	vscPage: async ({ browser, vscodeServer, testStartTime }, use, testInfo) => {
		// Get VS Code URL from server
		const vscodeUrl = vscodeServer.getUrl();
		if (!vscodeUrl) {
			throw new Error('VS Code server URL not available');
		}

		// Create a new page within the browser context
		// Using browser.newPage() creates an isolated context automatically
		const page = await browser.newPage();
		
		// Navigate to VS Code Web starting page
		await page.goto(vscodeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
		
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
			isFileOpen: (filename: string) => helpers.isFileOpen(page, filename),
			getEditorContent: () => helpers.getEditorContent(page),
			hasErrorDecorations: () => helpers.hasErrorDecorations(page),
			getHoverTooltip: (lineNumber: number) => helpers.getHoverTooltip(page, lineNumber),
			hasCodeLensDecorations: () => helpers.hasCodeLensDecorations(page),
		};

		await use(vscPage);
		
		// Cleanup: close page and log test duration
		const testDuration = Date.now() - testStartTime;
		console.log(`[${testInfo.title}] Test total duration: ${testDuration}ms`);
		await page.close();
	},
});

/**
 * Re-export expect for convenience
 */
export { expect };
