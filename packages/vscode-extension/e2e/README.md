# E2E Testing Guide

## Overview
The Brainy extension E2E tests use Playwright to control VS Code Web, providing real UI interaction testing.

## Architecture

### Components
1. **VS Code Web Server** - Launches VS Code Web with the extension
2. **Playwright Browser** - Controls the browser and interacts with VS Code UI
3. **Test Suite** - Defines test scenarios and assertions

### Test Flow
```
npm run e2e
  ↓
Build extension (npm run build)
  ↓
Playwright starts
  ↓
Launch VS Code Web server (@vscode/test-web)
  ↓
Open browser and navigate to VS Code Web
  ↓
Run test scenarios (click, inspect, assert)
  ↓
Capture screenshots on failure
  ↓
Close browser and stop server
```

## Running Tests

### Basic Run (headless)
```bash
npm run e2e
```

### Headed Mode (see browser)
```bash
npm run e2e:headed
```

### Debug Mode
```bash
npx playwright test --debug
```

### Run Specific Test
```bash
npx playwright test --grep "play button appears"
```

## Test Scenarios

### Play Button Tests
- ✓ Play button appears on `.brainy.md` files
- ✓ Play button has correct text and icon
- ✓ Play button does NOT appear on regular `.md` files

### Parse and Output Tests
- ✓ Clicking play button parses file and shows output
- ✓ Output is formatted as pretty JSON
- ✓ Success notification appears for valid playbook

### Error Handling Tests
- ✓ Parser errors trigger warning notification
- ✓ Error decorations appear in editor
- ✓ Hovering over error shows tooltip with message

### Integration Tests
- ✓ Can parse same file multiple times
- ✓ Can parse different files sequentially
- ✓ Editor remains functional after parsing

## Test Fixtures

Located in `packages/vscode-extension/e2e/test-project/`:
- `sample-playbook.brainy.md` - Valid playbook for success scenarios
- `playbook-with-errors.brainy.md` - Invalid playbook for error scenarios
- `README.md` - Regular markdown file (no play button)

## Screenshots

Test screenshots are saved to `test-results/`:
- `play-button-visible.png`
- `output-panel.png`
- `success-notification.png`
- `error-notification.png`
- `error-decorations.png`
- `error-tooltip.png`

## Troubleshooting

### VS Code Web doesn't start
- Check if port 3000-3100 range is available
- Ensure `@vscode/test-web` is installed: `npm install`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check VS Code Web server logs in terminal

### Extension not loaded
- Verify extension is built: `npm run build`
- Check `dist/extension.js` exists
- Verify `extensionDevelopmentPath` in `vscode-web-server.ts`

### Selectors not found
- VS Code Web UI may have changed
- Update selectors in `helpers/vscode-page-helpers.ts`
- Run in headed mode to inspect elements

## CI/CD Integration

For GitHub Actions or similar:
```yaml
- name: Install dependencies
  run: npm install

- name: Install Playwright browsers
  run: npx playwright install chromium

- name: Build extension
  run: npm run build

- name: Run E2E tests
  run: npm run e2e
```

## Maintenance

### Updating Tests
1. Modify test scenarios in `playbook.e2e.test.ts`
2. Update helpers if UI interaction patterns change
3. Rebuild extension: `npm run build`
4. Run tests: `npm run e2e`

### Adding New Test Scenarios
1. Add test case to appropriate `test.describe` block
2. Use helpers from `vscode-page-helpers.ts`
3. Add screenshots for visual verification
4. Document new fixtures if needed

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [@vscode/test-web](https://github.com/microsoft/vscode-test-web)
