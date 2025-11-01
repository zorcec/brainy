# Title
E2E Tests for Play Button, Highlighting, and Error Display

## Context
End-to-end tests are needed to validate the full user workflow for Brainy Markdown support in the VS Code extension. This includes UI interactions, highlighting, error display, and integration with the parser.

## Goal
- Simulate real user workflows in VS Code with the Brainy extension.
- Validate play button visibility, click behavior, and output logging.
- Assert annotation highlighting and error decorations/tooltips.
- Test across multiple themes and file types.

## Implementation Plan
- Use Playwright and/or vscode-test to automate VS Code and extension UI.
- Check the existing e2e test example.
- Add E2E test files in `/root/workspace/brainy/packages/vscode-extension/e2e`
- Prepare test `.brainy.md` files with various annotation patterns and errors (use real files from the workspace).
- Write tests to:
  - Open `.brainy.md` files and verify play button appears on the first line.
  - Click play button and assert parsed output is logged as pretty-printed JSON.
  - Edit file to introduce parser errors; verify error decorations and tooltips.
  - Switch themes and verify annotation highlighting (test with common/default light and dark themes).
  - Test with large and malformed files for performance and error handling.
- Only simulate user interactions in the VS Code UI; do not automate file system changes.
- No accessibility requirements for UI elements.
- E2E tests validate only the visual appearance (highlighting, decorations, error display), not underlying parser data.
- E2E tests are run locally with `npm run e2e`, not in CI.
- Use default reporting format (screenshots, logs, etc.) as provided by the test framework.
- Update README to document E2E test setup and execution.

## Definition of Done
- E2E tests cover play button, highlighting, error display, and output logging.
- Tests run automatically and pass in CI or local setup.
- README is updated with E2E test instructions.
- Implementation is reviewed and approved by stakeholders.

## Example E2E Test Scenarios

### Play Button Visibility
```typescript
// Open a .brainy.md file and check play button is present
await openFile('test-results/e2e/sample.brainy.md');
expect(await isPlayButtonVisible()).toBe(true);
```

### Play Button Click and Output
```typescript
// Click play button and check console output
await clickPlayButton();
const output = await getConsoleOutput();
expect(output).toContain('Parsed playbook');
```

### Error Decoration and Tooltip
```typescript
// Edit file to introduce a parser error
await editFile('test-results/e2e/sample.brainy.md', '@bad-annotation');
expect(await isErrorDecorationVisible()).toBe(true);
expect(await getErrorTooltip()).toContain('Invalid annotation syntax');
```

### Highlighting Fidelity Across Themes
```typescript
// Switch theme and verify annotation highlighting
await switchTheme('Dark+');
expect(await isAnnotationHighlighted()).toBe(true);
```
