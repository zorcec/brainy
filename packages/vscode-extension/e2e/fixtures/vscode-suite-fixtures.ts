/**
 * Module: e2e/fixtures/vscode-suite-fixtures.ts
 *
 * Description:
 *   Suite-level Playwright fixtures for VS Code Web E2E testing.
 *   Provides a shared browser context and page for all tests in a suite.
 *   This is useful for tests that don't need complete isolation between each test.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/vscode-suite-fixtures';
 *   
 *   test.beforeAll(async ({ vscPage }) => {
 *     // Setup shared for all tests
 *   });
 *   
 *   test('my test', async ({ vscPage }) => {
 *     await vscPage.openFile('sample.md');
 *   });
 */

import { test as base, expect, Page } from '@playwright/test';
import { VSCodeWebServer } from '../vscode-web-server';
import * as helpers from '../helpers/vscode-page-helpers';
import { VSCodePage } from './vscode-fixtures';

/**
 * Worker-scoped fixtures (shared across tests in same worker)
 */
type VSCodeWorkerFixtures = {
	/** VS Code Web server instance (one per worker) */
	vscodeServer: VSCodeWebServer;
	/** VS Code page shared across all tests in the worker */
	vscPage: VSCodePage;
};

/**
 * Test-scoped fixtures
 */
type VSCodeTestFixtures = {
	/** Test start time for metrics */
	testStartTime: number;
};

/**
 * Extended test with suite-level VS Code fixtures
 */
export const test = base.extend<VSCodeTestFixtures, VSCodeWorkerFixtures>({
	/**
	 * Test start time fixture
	 */
	testStartTime: async ({}, use) => {
		const startTime = Date.now();
		await use(startTime);
	},

	/**
	 * VS Code server fixture (worker-scoped)
	 */
	vscodeServer: [async ({}, use, workerInfo) => {
		const startTime = Date.now();
		const server = new VSCodeWebServer();
		await server.start();
		
		const setupTime = Date.now() - startTime;
		console.log(`[Worker ${workerInfo.workerIndex}] VS Code server setup completed in ${setupTime}ms`);
		
		await use(server);
		
		const metrics = server.getMetrics();
		if (metrics) {
			console.log(`[Worker ${workerInfo.workerIndex}] Server metrics: ${JSON.stringify(metrics)}`);
		}
		await server.stop();
	}, { scope: 'worker' }],

	/**
	 * VS Code page fixture (worker-scoped for suite-level sharing)
	 * Reuses the same page across all tests in the suite
	 */
	vscPage: [async ({ browser, vscodeServer }, use, workerInfo) => {
		const vscodeUrl = vscodeServer.getUrl();
		if (!vscodeUrl) {
			throw new Error('VS Code server URL not available');
		}

		const page = await browser.newPage();
		
		await page.goto(vscodeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
		await helpers.waitForWorkbench(page);
		
		console.log(`[Worker ${workerInfo.workerIndex}] Shared VS Code page created for suite`);

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
		
		await page.close();
		console.log(`[Worker ${workerInfo.workerIndex}] Shared VS Code page closed`);
	}, { scope: 'worker' }],
});

/**
 * Re-export expect for convenience
 */
export { expect };
export type { VSCodePage };
