# E2E Test Optimization Summary

## ✅ Completed Work

### 1. Parallel Test Execution
- **Before**: Tests ran sequentially with a single shared VS Code server
- **After**: Each test starts its own isolated VS Code server instance with a unique random port
- **Configuration Changes**:
  - `playwright.config.ts`: Set `fullyParallel: true` and `workers: 4`
  - `vscode-web-server.ts`: Refactored to class-based architecture (`VSCodeWebServer`)
  - `playbook.e2e.test.ts`: Changed from `beforeAll`/`afterAll` to `beforeEach`/`afterEach`

### 2. Random Port Assignment
- Implemented `findRandomAvailablePort()` function
- Port range: 10000-60000
- Eliminates port collision issues in parallel execution
- Simplified from complex port tracking to simple random selection

### 3. Improved Test Robustness
- Added longer wait times for extension activation
- Enhanced file opening logic with better error handling
- Added activation event in `package.json` for markdown files
- Registered `brainy.playbook.parse` command in contributes section

## 🔍 Current Status

### Working
- ✅ Parallel test execution with random ports
- ✅ Multiple VS Code server instances running simultaneously
- ✅ No port conflicts
- ✅ Clean server startup and shutdown

### Known Issues
1. **CodeLens Not Appearing**: The play button (CodeLens) is not showing up in tests
   - Extension appears to load but CodeLens provider may not be activating
   - Tests timeout waiting for `.codelens-decoration` elements
   - Possible causes:
     - Extension activation timing
     - VS Code Web CodeLens rendering delay
     - File association not triggering properly

## 🚀 Test Speed Optimization Recommendations

### 1. **Shared Browser Context** (30-40% speed improvement)
**Current**: Each test creates a new browser instance
**Recommended**: Share browser context across tests in a worker

```typescript
let sharedBrowser: Browser;

test.beforeAll(async () => {
  sharedBrowser = await chromium.launch({ headless: true });
});

test.beforeEach(async () => {
  const context = await sharedBrowser.newContext();
  page = await context.newPage();
  // ... rest of setup
});

test.afterEach(async () => {
  await page.context().close();
});

test.afterAll(async () => {
  await sharedBrowser.close();
});
```

### 2. **VS Code Server Pooling** (50-60% speed improvement)
**Current**: Each test starts/stops its own VS Code server (~6-8s overhead per test)
**Recommended**: Pre-start a pool of servers and reuse them

```typescript
class VSCodeServerPool {
  private servers: VSCodeWebServer[] = [];
  private available: VSCodeWebServer[] = [];
  
  async initialize(count: number) {
    for (let i = 0; i < count; i++) {
      const server = new VSCodeWebServer();
      await server.start();
      this.servers.push(server);
      this.available.push(server);
    }
  }
  
  async acquire(): Promise<VSCodeWebServer> {
    while (this.available.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.available.pop()!;
  }
  
  release(server: VSCodeWebServer) {
    this.available.push(server);
  }
}
```

### 3. **Reduce Initialization Time** (20-30% speed improvement)
- **Remove slowMo**: Currently not set, but ensure it stays at 0
- **Faster timeouts**: Reduce `waitForWorkbench` and `waitForTimeout` calls
- **Parallel initialization**: Start server and browser simultaneously

```typescript
test.beforeEach(async ({ browser }) => {
  const [vscodeUrl] = await Promise.all([
    server.start(),
    // Other async initialization
  ]);
  
  page = await browser.newPage();
  await page.goto(vscodeUrl, { waitUntil: 'domcontentloaded' }); // Instead of 'networkidle'
});
```

### 4. **Reduce VS Code Startup Time** (15-25% speed improvement)
```typescript
// Add to vscode-web-server.ts start()
this.serverProcess = spawn('npx', [
  '@vscode/test-web',
  '--browserType=none',
  '--port=' + this.serverPort,
  '--extensionDevelopmentPath=' + extensionDevelopmentPath,
  '--skip-welcome',  // Skip welcome page
  '--disable-telemetry',  // Disable telemetry
  '--disable-updates',  // Disable update checks
  folderPath
]);
```

### 5. **Test Grouping & Fixtures** (10-20% speed improvement)
Group related tests to share setup:

```typescript
test.describe('CodeLens Tests', () => {
  test.beforeEach(async () => {
    await helpers.openFile(page, 'sample-playbook.brainy.md');
  });
  
  test('play button appears', async () => {
    // File already open
  });
  
  test('play button has correct text', async () => {
    // File already open
  });
});
```

### 6. **Headless Optimization** (5-10% speed improvement)
Ensure headless mode is properly configured:

```typescript
// playwright.config.ts
use: {
  headless: true,
  screenshot: 'only-on-failure',  // Not on every test
  video: 'retain-on-failure',  // Not on every test
  trace: 'retain-on-failure',  // Not 'on-first-retry'
}
```

### 7. **Selective Test Execution** (Variable improvement)
```bash
# Run only fast smoke tests in development
npm run e2e -- --grep "@smoke"

# Run full suite in CI
npm run e2e
```

### 8. **Parallel Workers Tuning**
**Current**: 4 workers
**Recommended**: Match CPU cores but consider memory

```typescript
// playwright.config.ts
workers: process.env.CI ? 2 : 4,  // Less workers in CI to avoid memory issues
```

### 9. **Mock/Stub Heavy Operations**
- Mock parser for UI-only tests
- Stub server responses where appropriate
- Use test doubles for time-consuming operations

### 10. **Test Data Optimization**
- Use minimal test files (current files are good)
- Avoid large markdown files unless testing parser performance
- Cache parsed results when possible

## 📊 Expected Performance Impact

| Optimization | Time Saved Per Test | Implementation Effort |
|--------------|---------------------|----------------------|
| Server Pooling | 5-7s | High |
| Shared Browser Context | 2-3s | Low |
| Reduce Initialization | 1-2s | Low |
| VS Code Startup Flags | 0.5-1s | Low |
| Test Grouping | 0.5-1s | Medium |
| Headless Optimization | 0.2-0.5s | Low |

**Total Potential**: 9-14.5 seconds per test
**For 16 tests**: 144-232 seconds saved (~2.5-4 minutes faster)
**With parallelization (4 workers)**: ~36-58 seconds saved per test run

## 🛠️ Implementation Priority

1. **Quick Wins** (Implement first - Low effort, good impact):
   - Shared browser context
   - Headless optimization
   - VS Code startup flags
   - Reduce initialization time

2. **Medium Term** (Moderate effort, high impact):
   - Server pooling
   - Test grouping & fixtures

3. **Long Term** (High effort, variable impact):
   - Mock/stub operations
   - Selective test execution strategy

## 📝 Next Steps

1. **Fix CodeLens Issue**: Investigate why CodeLens is not appearing
   - Add debug logging to extension activation
   - Check VS Code Web extension loading
   - Verify CodeLens provider registration timing

2. **Add Missing Tests**: Once CodeLens works, add tests for:
   - Multiple file parsing
   - Error highlighting
   - Different playbook formats
   - Edge cases

3. **Implement Quick Win Optimizations**: Start with browser context sharing

4. **Monitor Performance**: Add timing metrics to track improvements

## 🐛 Debugging Tips

To debug the CodeLens issue:

```bash
# Run with headed mode to see what's happening
npm run e2e:headed

# Run single test
npx playwright test --grep "play button appears"

# Show trace
npx playwright show-trace test-results/[test-name]/trace.zip

# Check extension logs
# Look in VS Code Web console (F12) for extension activation messages
```

## 📚 Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [VS Code Web Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Playwright Parallelization](https://playwright.dev/docs/test-parallel)
