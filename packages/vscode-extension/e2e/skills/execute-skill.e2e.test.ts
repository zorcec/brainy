import { test, expect } from '../fixtures/vscode-suite-fixtures';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Execute Skill E2E', () => {
  test('executes TypeScript code blocks and writes file', async ({ vscPage }) => {
    const testProjectRoot = path.join(__dirname, '../test-project');
    const outputFile = path.join(testProjectRoot, '.brainy', 'temp', 'execute-test-output.txt');
    
    // Clean up any existing test file
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
    
    await vscPage.openFile('skills/execute/execute-test.brainy.md');
    await vscPage.clickPlayButton();
    
    // Wait for execution to complete
    await vscPage.page.waitForTimeout(3000);
    
    // Check for completion
    const notifications = await vscPage.getNotifications();
    const hasCompleted = notifications.some(n => 
      n.toLowerCase().includes('playbook execution completed')
    );
    const hasError = notifications.some(n =>
      n.toLowerCase().includes('error') || n.toLowerCase().includes('failed')
    );
    
    expect(hasError).toBe(false);
    expect(hasCompleted).toBe(true);
    
    // Verify the file was created in the correct location (workspace root)
    expect(fs.existsSync(outputFile)).toBe(true);
    
    // Verify content
    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toBe('TypeScript execution successful!');
    
    // Clean up
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  });
  
  test('executes code in workspace root directory', async ({ vscPage }) => {
    const testProjectRoot = path.join(__dirname, '../test-project');
    const outputFile = path.join(testProjectRoot, '.brainy', 'temp', 'execute-test-output.txt');
    
    // Clean up any existing test file
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
    
    await vscPage.openFile('skills/execute/execute-test.brainy.md');
    await vscPage.clickPlayButton();
    
    // Wait for execution to complete
    await vscPage.page.waitForTimeout(3000);
    
    // Verify working directory by checking file location
    // The code writes to process.cwd()/.brainy/temp/execute-test-output.txt
    // If working directory is correct, this should be in test-project root
    expect(fs.existsSync(outputFile)).toBe(true);
    
    // Clean up
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  });
});
