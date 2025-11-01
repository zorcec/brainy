/**
 * Module: e2e/helpers/vscodeTestSetup.ts
 *
 * Description:
 *   VS Code test setup utilities for E2E tests.
 *   Provides functions to launch VS Code with the extension and interact with the UI.
 *
 * Usage:
 *   import { launchVSCode, openFile, clickCodeLens } from './helpers/vscodeTestSetup';
 */

import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { BrowserContext, Page, chromium } from '@playwright/test';

/**
 * VS Code instance information
 */
export type VSCodeInstance = {
	/** Browser context for Playwright */
	context: BrowserContext;
	/** Main VS Code page */
	page: Page;
	/** VS Code process */
	process: ChildProcess;
	/** User data directory */
	userDataDir: string;
};

/**
 * Launches VS Code with the extension installed for E2E testing
 */
export async function launchVSCode(
	extensionPath: string,
	workspacePath: string
): Promise<VSCodeInstance> {
	const userDataDir = path.join(__dirname, '..', '.vscode-test-user-data');
	
	// Get VS Code executable path
	const vscodeExecutablePath = process.env.VSCODE_PATH || 'code';
	
	// Launch VS Code with extension development host
	const vscodeProcess = spawn(
		vscodeExecutablePath,
		[
			'--extensionDevelopmentPath=' + extensionPath,
			'--user-data-dir=' + userDataDir,
			'--disable-extensions',
			'--disable-gpu',
			workspacePath
		],
		{
			stdio: 'pipe',
			detached: false
		}
	);

	// Wait for VS Code to start
	await new Promise((resolve) => setTimeout(resolve, 3000));

	// Connect Playwright to the Electron instance
	const browser = await chromium.connectOverCDP('http://localhost:9222');
	const contexts = browser.contexts();
	const context = contexts[0];
	const pages = context.pages();
	const page = pages[0];

	return {
		context,
		page,
		process: vscodeProcess,
		userDataDir
	};
}

/**
 * Closes VS Code instance
 */
export async function closeVSCode(instance: VSCodeInstance): Promise<void> {
	await instance.context.close();
	instance.process.kill();
}

/**
 * Opens a file in VS Code
 */
export async function openFile(page: Page, filePath: string): Promise<void> {
	// Execute VS Code command to open file
	await page.evaluate((path) => {
		(window as any).vscode.commands.executeCommand('vscode.open', path);
	}, filePath);
	
	// Wait for file to be opened
	await page.waitForTimeout(1000);
}

/**
 * Clicks a CodeLens item by its title
 */
export async function clickCodeLens(page: Page, title: string): Promise<void> {
	const codeLensSelector = `a.codelens-decoration:has-text("${title}")`;
	await page.click(codeLensSelector);
}

/**
 * Gets the output channel content
 */
export async function getOutputChannelText(page: Page, channelName: string): Promise<string> {
	// Open output panel
	await page.evaluate(() => {
		(window as any).vscode.commands.executeCommand('workbench.action.output.toggleOutput');
	});
	
	await page.waitForTimeout(500);
	
	// Get output content
	const outputContent = await page.evaluate(() => {
		const outputElement = document.querySelector('.output-view .monaco-editor .view-lines');
		return outputElement?.textContent || '';
	});
	
	return outputContent;
}

/**
 * Checks if error decorations are visible in the editor
 */
export async function hasErrorDecorations(page: Page): Promise<boolean> {
	const decorations = await page.$$('.monaco-editor .line-decorations .error-decoration');
	return decorations.length > 0;
}

/**
 * Gets error tooltip text by hovering over a line
 */
export async function getErrorTooltip(page: Page, lineNumber: number): Promise<string> {
	// Hover over the line
	const lineSelector = `.monaco-editor .view-lines .view-line[data-line-number="${lineNumber}"]`;
	await page.hover(lineSelector);
	
	// Wait for tooltip
	await page.waitForTimeout(500);
	
	// Get tooltip text
	const tooltip = await page.$('.monaco-hover-content');
	return (await tooltip?.textContent()) || '';
}

/**
 * Checks if the play button CodeLens is visible
 */
export async function isPlayButtonVisible(page: Page): Promise<boolean> {
	try {
		const playButton = await page.$('a.codelens-decoration:has-text("Parse Playbook")');
		return playButton !== null;
	} catch {
		return false;
	}
}
