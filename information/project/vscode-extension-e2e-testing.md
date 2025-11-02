# True E2E testing for VS Code extensions — Research & actionable guide

This document summarizes how to implement true end-to-end (E2E) testing for Visual Studio Code extensions (desktop/electron and web), how to speed up test execution, CI best practices, trade-offs, and concrete examples.

Date: 2025-11-02

## Goals / Contract
- Inputs: extension source tree (desktop and/or web), test suites (Mocha or other), CI runner.
- Outputs: reproducible E2E test runs that exercise the extension in a real VS Code host (Extension Development Host) or VS Code for Web in a browser; diagnostics and artifacts for failures.
- Error modes: download failures, headless browser issues, UI timing/flakiness, platform differences.
- Success criteria: tests run in CI reliably, downloads cached to avoid re-downloading VS Code builds, full-stack workflows tested (activation, UI interactions, file I/O).

## Short summary / recommendation
- Use the Microsoft-maintained tooling: `@vscode/test-electron` (desktop) and `@vscode/test-web` (web). They are the supported, stable path to run real E2E tests.
- Organize tests into fast unit tests + separate E2E suites. Run unit tests (fast) on every push; run E2E in CI matrix / nightly or on PRs as needed.
- Cache downloaded VS Code builds and test artifacts (.vscode-test or testRunnerDataDir) in CI. Provide a stable `vscodeExecutablePath` to the runner to skip redownloads.
- For web extensions, prebuild the web bundle (compile-web) and cache dist outputs; run `@vscode/test-web` via Playwright headless to run UI interactions quickly.
- Split and parallelize independent E2E suites across CI jobs to reduce wall-clock time.

## Key tools & why
- `@vscode/test-electron` (a.k.a. vscode-test): downloads/unzips real VS Code and launches Extension Development Host for tests. Good for desktop/extension-host behavior and native APIs.
- `@vscode/test-web` (vscode-test-web): launches a web server + Playwright browser to run VS Code for Web and web extensions. Use for web-compatible extensions and browser-specific UI e2e.
- Playwright: used by `vscode-test-web` to drive browser interactions and run headless tests reliably.
- Mocha (common test runner) or any programmatic runner; keep tests deterministic and label/group them for CI filtering.

## Desktop (Electron) E2E — patterns
1. Test runner script (sample pattern)

```ts
// test/runTest.ts
import * as path from 'path';
import { runTests, downloadAndUnzipVSCode } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Optional: pre-download a specific VS Code version and reuse it across runs
    // const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders');

    await runTests({ extensionDevelopmentPath, extensionTestsPath /*, vscodeExecutablePath */ });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
```

2. Speed-ups
- Cache the `.vscode-test` folder where `downloadAndUnzipVSCode` stores builds. This avoids repeated downloads in CI.
- Use `vscodeExecutablePath` to point to a cached build.
- Use `--disable-extensions` launchArg to avoid slow third-party extension activation.
- Keep test workspaces minimal (tiny files), avoid large projects.
- Run smaller focused E2E suites in parallel (split by label/--label).

3. CI tips
- On Linux CI, run tests under Xvfb or use headless runner where supported (use xvfb-run -a npm test). See GitHub Actions / Azure Pipelines examples.
- Cache the downloaded VS Code builds and the node_modules. When using GitHub Actions, cache `~/.vscode-test` or project-level `.vscode-test` and `node_modules`.

## Web (Browser) E2E — patterns
1. Build first
- Ensure the extension is compiled for web targets (usually a `npm run compile-web` or bundler step). The `vscode-test-web` README mandates compiled web sources when using `--sourcesPath`.
- Pre-build and cache `dist/web` to speed test runs.

2. Using `@vscode/test-web` (API example)

```js
// test/runWebTests.js
const path = require('path');
const { runTests } = require('@vscode/test-web');

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    await runTests({
      browserType: 'chromium',
      extensionDevelopmentPath,
      extensionTestsPath,
      // testRunnerDataDir: '/tmp/vscode-web-test-data' // can be cached between CI runs
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
main();
```

3. Speed-ups
- Use headless browser mode and Playwright's fast path.
- Cache `testRunnerDataDir` or server build artifacts to reuse VS Code web builds.
- If tests access network resources, use `--browserOption=--disable-web-security` carefully or mock network in tests.

## CI configuration & caching (concrete examples)
- GitHub Actions: cache `~/.vscode-test` (or repo `.vscode-test`) and `~/.cache/ms-playwright` (or Playwright browser downloads) and `node_modules`.

Example GitHub Actions fragment (conceptual):

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Cache node_modules
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      - name: Cache vscode builds
        uses: actions/cache@v4
        with:
          path: |
            ~/.vscode-test
            .vscode-test
          key: vscode-build-${{ runner.os }}-v1
      - name: Install deps
        run: npm ci
      - name: Run desktop e2e (linux)
        run: xvfb-run -a npm run test:e2e -- --label=desktop
      - name: Run web e2e
        run: npm run test:web
```

Notes:
- Replace cache keys with versioned keys if you upgrade VS Code versions.
- On macOS/Windows runners, adjust paths and Xvfb steps accordingly.

## Test organization & parallelization
- Keep unit tests (fast) separate and run them pre-merge on all pushes.
- Tag heavy E2E tests (desktop/web) and run them in a CI matrix or on PR merges.
- Split E2E suites into smaller logical groups (activation, commands/UI flows, integration) and run each group in a separate job to parallelize.
- Use `--label` or environment variables to select suites.

## Flakiness and robustness
- Avoid timing-based waits; rely on `waitFor` or `await` for UI conditions.
- Increase Mocha timeouts for slow CI environments and use retries sparingly (but useful for flaky UI tests).
- Capture screenshots, console logs, and server logs on failure for post-mortem.

## Common slow points and mitigations
- VS Code download/unzip: cache downloaded builds or provide preinstalled `vscodeExecutablePath`.
- Extension activation cost: reduce activation complexity for tests (feature flags, smaller activation hooks); consider special test activation path.
- Network calls in extension: mock network or run a local test server.
- Large workspace: use minimal fixtures.

## Advanced: fast feedback loop locally
- Use a small subset of smoke E2E tests run on file save / pre-commit to catch major regressions fast.
- Use watch mode for compilation (`npm run watch`) and `@vscode/test-electron` in interactive debug mode for local debugging.

## Trade-offs
- Desktop (Electron) tests are closest to production but slower and require managing platform differences.
- Web tests (vscode-test-web) are faster for browser-specific UIs but won't exercise native node APIs or native host behavior.
- Heavy caching speeds CI but can hide incompatibilities with new VS Code versions.

## Practical checklist to implement
1. Add test runner scripts using `@vscode/test-electron` and `@vscode/test-web`.
2. Split tests into unit and E2E suites; label them.
3. Add GitHub Actions (or CI) with caching for `.vscode-test`, Playwright caches, and `node_modules`.
4. Prebuild web bundles and cache artifacts.
5. Parallelize E2E suites across CI jobs.
6. Add failure artifact collection (screenshots, logs) and timeouts/retries where necessary.

## References & sources (read & cross-checked)
- VS Code docs — Testing Extensions (official): https://code.visualstudio.com/api/working-with-extensions/testing-extension
- Microsoft vscode-test (desktop) repo: https://github.com/microsoft/vscode-test
- microsoft/vscode-test-web project (web testing with Playwright): https://github.com/microsoft/vscode-test-web
- @vscode/test-web npm: https://www.npmjs.com/package/@vscode/test-web
- VS Code extension samples: https://github.com/microsoft/vscode-extension-samples (see helloworld-test-sample)
- VS Code CI guidance: https://code.visualstudio.com/api/working-with-extensions/continuous-integration
- Playwright docs / patterns (used by vscode-test-web) — refer to Playwright site and the Playwright-driven parts of vscode-test-web README.
- Issue observations: caching/download issues and packed extension feature requests observed in microsoft/vscode-test and microsoft/vscode-test-web issue trackers.

---

If you'd like, I can:
- add a concrete GitHub Actions workflow file in the `brainy` repo tuned to your existing packages (split desktop/web jobs),
- scaffold `test/runTest.ts` and `test/runWebTests.js` in `packages/vscode-extension` and wire npm scripts,
- or create a small sample that demonstrates caching and parallelization.
