/**
 * Module: e2e/vscode-web-server.ts
 *
 * Description:
 *   Launches VS Code Web server for Playwright E2E tests.
 *   Spawns the @vscode/test-web server as a child process.
 *   Supports multiple parallel instances with unique ports.
 *
 * Usage:
 *   import { VSCodeWebServer } from './vscode-web-server';
 *   const server = new VSCodeWebServer();
 *   await server.start();
 *   await server.stop();
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as http from 'http';

/**
 * VS Code Web server instance for parallel test execution
 */
export class VSCodeWebServer {
	private serverProcess: ChildProcess | undefined;
	private serverPort: number | undefined;
	private serverUrl: string | undefined;

	/**
	 * Starts VS Code Web server with the extension
	 * 
	 * @returns URL to connect to VS Code Web
	 */
	async start(): Promise<string> {
		// Extension path should point to the extension folder itself
		const extensionDevelopmentPath = path.resolve(__dirname, '..');
		const folderPath = path.resolve(__dirname, 'test-project');
		
		// Find a random available port (range 10000-60000)
		this.serverPort = await findRandomAvailablePort();
		
		console.log(`Starting VS Code Web on port ${this.serverPort}...`);
		console.log(`Extension path: ${extensionDevelopmentPath}`);
		console.log(`Workspace path: ${folderPath}`);
		
		// Start VS Code Web using npx
		this.serverProcess = spawn(
			'npx',
			[
				'@vscode/test-web',
				'--browserType=none',
				'--port=' + this.serverPort,
				'--extensionDevelopmentPath=' + extensionDevelopmentPath,
				folderPath
			],
			{
				stdio: 'pipe',
				cwd: path.resolve(__dirname, '../..')
			}
		);

		// Log server output for debugging
		this.serverProcess.stdout?.on('data', (data) => {
			console.log(`[VS Code Web ${this.serverPort}] ${data.toString().trim()}`);
		});

		this.serverProcess.stderr?.on('data', (data) => {
			console.error(`[VS Code Web ${this.serverPort} Error] ${data.toString().trim()}`);
		});

		// Wait for server to be ready
		await waitForServer(this.serverPort);
		
		// Extra time for VS Code to fully initialize
		await new Promise(resolve => setTimeout(resolve, 3000));

		this.serverUrl = `http://localhost:${this.serverPort}`;
		console.log(`VS Code Web ready at: ${this.serverUrl}`);
		
		return this.serverUrl;
	}

	/**
	 * Stops VS Code Web server
	 */
	async stop(): Promise<void> {
		if (this.serverProcess) {
			console.log(`Stopping VS Code Web server on port ${this.serverPort}...`);
			
			this.serverProcess.kill('SIGTERM');
			
			// Wait for process to exit
			await new Promise<void>((resolve) => {
				this.serverProcess!.once('exit', () => {
					resolve();
				});
				// Force kill after timeout
				setTimeout(() => {
					if (this.serverProcess && !this.serverProcess.killed) {
						this.serverProcess.kill('SIGKILL');
					}
					resolve();
				}, 5000);
			});
			
			this.serverProcess = undefined;
			this.serverPort = undefined;
			this.serverUrl = undefined;
		}
	}

	getUrl(): string | undefined {
		return this.serverUrl;
	}

	getPort(): number | undefined {
		return this.serverPort;
	}
}

/**
 * Waits for the server to be ready
 */
async function waitForServer(port: number, maxAttempts = 60): Promise<void> {
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const response = await fetch(`http://localhost:${port}`);
			if (response.ok) {
				return;
			}
		} catch {
			// Server not ready yet
		}
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
	throw new Error(`VS Code Web server did not start on port ${port} after ${maxAttempts} attempts`);
}

/**
 * Finds a random available port in the range 10000-60000
 */
async function findRandomAvailablePort(maxAttempts = 50): Promise<number> {
	for (let i = 0; i < maxAttempts; i++) {
		// Generate random port in safe range
		const port = Math.floor(Math.random() * (60000 - 10000 + 1)) + 10000;
		
		if (await isPortAvailable(port)) {
			return port;
		}
	}
	throw new Error('Could not find an available port after ' + maxAttempts + ' attempts');
}

/**
 * Checks if a port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const testServer = http.createServer();
		testServer.once('error', () => resolve(false));
		testServer.once('listening', () => {
			testServer.close();
			resolve(true);
		});
		testServer.listen(port);
	});
}

