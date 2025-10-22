import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';

let brainyServerProcess: ChildProcess | null = null;

export function startBrainyServer(): void {
  if (brainyServerProcess) {
    console.warn('Brainy server is already running.');
    return;
  }
  const serverPath = path.resolve(__dirname, '../../server');
  const serverScript = path.join(serverPath, 'dist', 'server.js');
  brainyServerProcess = spawn('node', [serverScript], {
    cwd: serverPath,
    stdio: 'inherit',
    env: process.env,
  });
  brainyServerProcess.on('exit', (code) => {
    console.log(`Brainy server exited with code ${code}`);
    brainyServerProcess = null;
  });
}

export function stopBrainyServer(): void {
  if (brainyServerProcess) {
    brainyServerProcess.kill();
    brainyServerProcess = null;
  }
}
