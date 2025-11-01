// Conditional import for Node.js environments
let childProcess: any;
let brainyServerProcess: any = null;

// Check if we're running in a Node.js environment
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

if (isNode) {
  try {
    childProcess = require('child_process');
  } catch (e) {
    console.warn('child_process not available');
  }
}

export function startBrainyServer(): void {
  if (!isNode || !childProcess) {
    console.log('Brainy server not available in web environment');
    return;
  }

  if (brainyServerProcess) {
    console.warn('Brainy server is already running.');
    return;
  }

  try {
    const path = require('path');
    const serverPath = path.resolve(__dirname, '../../server');
    const serverScript = path.join(serverPath, 'dist', 'server.js');
    
    brainyServerProcess = childProcess.spawn('node', [serverScript], {
      cwd: serverPath,
      stdio: 'inherit',
      env: process.env,
    });
    
    brainyServerProcess.on('exit', (code: number) => {
      console.log(`Brainy server exited with code ${code}`);
      brainyServerProcess = null;
    });
  } catch (error) {
    console.error('Failed to start Brainy server:', error);
  }
}

export function stopBrainyServer(): void {
  if (brainyServerProcess) {
    brainyServerProcess.kill();
    brainyServerProcess = null;
  }
}
