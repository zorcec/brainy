## Title
E2E Tests for Play Button, Highlighting, and Error Display (Ready)

## Purpose
This ticket is a ready-to-implement specification for E2E tests that validate the VS Code extension's Markdown playbook UI. The document contains explicit, actionable tasks, file paths, test scenarios, and run instructions so an automated agent or developer can implement and run the tests with minimal interpretation.

## Context
End-to-end tests are required to validate the full user workflow for Brainy Markdown support in the VS Code extension: UI interactions (play button), parser integration (parse + output), and editor visuals (highlighting and error decorations).

## Goal
- Automate realistic UI checks in VS Code to assert: play button visibility and behavior, output logging, inline error decorations and tooltips, and highlighting fidelity across themes.

## Environment & Where to Place Tests
- Playwright is already used by this repository. E2E tests live under:
  - `packages/vscode-extension/e2e/`
  - Test assets (playbooks) live under `packages/vscode-extension/e2e/test-project/` (already created)
- Run locally with:
```bash
npm run e2e
```

## Files & Fixtures (already present)
- `packages/vscode-extension/e2e/test-project/sample-playbook.brainy.md`
- `packages/vscode-extension/e2e/test-project/playbook-with-errors.brainy.md`

## Agent-friendly Implementation Plan (step-by-step)
1. Preparation
   - Ensure Playwright is installed (project has it configured).
   - Build the extension `npm run build` at repo root.
2. Add tests
   - Create a new test file: `packages/vscode-extension/e2e/playbook.e2e.test.ts`.
   - Import the existing E2E helper patterns from `example-ui.e2e.test.js` and adapt for the playbook scenarios.
3. Test scaffolding (helpers)
   - Provide small helper functions in the test file or a new helper module:
     - `openTestFile(filePath: string)` — open file in the VS Code instance used by Playwright.
     - `isPlayButtonVisible()` — query the editor for CodeLens or toolbar element with the play icon.
     - `clickPlayButton()` — simulate a click on the play CodeLens item.
     - `getOutputChannelText(channelName: string)` — read the output channel content (or capture console logs) to assert `Parsed playbook` output.
     - `isErrorDecorationVisible()` & `getErrorTooltip()` — query editor decorations and hover tooltip UI.
     - `switchTheme(themeName: string)` — change the workbench theme to validate highlighting.
4. Implement tests (example scenarios below)
   - Tests must be visual/behavioral only; do not rely on internal parser APIs. Use text in the output channel to assert parsing occurrence.
5. Run & iterate
   - Run `npm run e2e` locally. Iteratively fix test flakiness, add waits for UI readiness (e.g., wait for CodeLens to be available), and use Playwright tracing/screenshots when failures occur.

## Example Test Scenarios (agent-ready pseudocode)
- Play Button Visibility
```ts
// packages/vscode-extension/e2e/playbook.e2e.test.ts
test('play button appears on first line for .brainy.md', async ({ vscode }) => {
  await openTestFile('e2e/test-project/sample-playbook.brainy.md');
  expect(await isPlayButtonVisible()).toBe(true);
});
```

- Play Button Click and Output
```ts
test('clicking play parses file and logs parsed output', async ({ vscode }) => {
  await openTestFile('e2e/test-project/sample-playbook.brainy.md');
  await clickPlayButton();
  const output = await getOutputChannelText('Brainy Playbook');
  expect(output).toContain('Parsed playbook');
  // Optionally assert that JSON is pretty-printed
  expect(output).toMatch(/\{\n\s+"blocks"/);
});
```

- Error Decoration and Tooltip
```ts
test('parser errors produce inline decoration and hover tooltip', async ({ vscode }) => {
  await openTestFile('e2e/test-project/playbook-with-errors.brainy.md');
  await clickPlayButton();
  expect(await isErrorDecorationVisible()).toBe(true);
  const tooltip = await getErrorTooltip();
  expect(tooltip).toContain('UnclosedCodeBlock');
});
```

- Theme/Highlighting Sanity Check
```ts
test('annotation highlighting works across themes', async ({ vscode }) => {
  await openTestFile('e2e/test-project/sample-playbook.brainy.md');
  await switchTheme('Dark+');
  expect(await isAnnotationHighlighted()).toBe(true);
});
```

Notes about the helpers: Implementations depend on the Playwright VS Code test harness API used in existing `example-ui.e2e.test.js`. Prefer small, robust DOM selectors (gutter/CodeLens text) and explicit waits.

## Implementation Tasks (actionable checklist)
- [ ] Create test file `packages/vscode-extension/e2e/playbook.e2e.test.ts` (scenarios above)
- [ ] Add optional helper module `packages/vscode-extension/e2e/helpers/playbookHelpers.ts` for the utility functions
- [ ] Ensure `packages/vscode-extension/e2e/test-project/` contains the test fixtures (already done)
- [ ] Run `npm run build` and `npm run e2e` locally and fix any flakiness
- [ ] Capture screenshots/traces for failures and add them to test output
- [ ] Update this ticket with test results and any follow-ups

## How to Run (commands)
Run these from the repository root:
```bash
# Build all packages
npm run build

# Run e2e tests (Playwright)
npm run e2e
```

If you only want to run tests in the extension package folder directly:
```bash
cd packages/vscode-extension
npx playwright test
```

## Definition of Done (explicit)
- Tests are added to `packages/vscode-extension/e2e/` and reference fixtures in `e2e/test-project/`.
- Play button visibility test passes reliably.
- Clicking the play button produces an output entry in the "Brainy Playbook" output channel containing `Parsed playbook` and pretty JSON.
- The error playbook produces inline decorations and hover tooltips with the parser error messages.
- Tests run locally via `npm run e2e` and produce traces/screenshots for failed runs.
- README updated with run instructions (this ticket includes run commands).

## Risks & Notes for the Agent
- Launching VS Code in a reproducible environment may be platform-dependent; prefer the repository's Playwright harness used in existing e2e tests.
- Use explicit timeouts and waits; UI operations can be asynchronous.
- Keep tests visual/behavioral-only — avoid importing internal parser functions.

## Follow-ups (optional enhancements)
- Add E2E test to validate inline highlight colors across themes by sampling computed styles (if necessary).
- Add a test fixture for very large `.brainy.md` files to measure UI performance.

---

If you want, I can scaffold the new Playwright test file and small helper module now (it will be a best-effort implementation using the existing `example-ui.e2e.test.js` patterns). Otherwise this ticket is ready for an automated agent or developer to pick up and implement.
