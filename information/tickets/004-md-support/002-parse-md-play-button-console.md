# Title
Parse Markdown Playbooks, Add Play Button, Console Log Parsed Output

## Context
Users need a simple way to parse playbook content and preview results. The extension should add a play button to the Markdown editor, parse the file on click, and log the parsed structure.

## Goal
- Add a play button to the Markdown editor UI.
- On click, parse the current file for playbook annotations and code blocks.
- Console log the parsed output for inspection.

## Implementation Plan
- Use VS Code’s editor API to add a play button inside the editor, on the first line of Markdown files ending with ".brainy.md".
- On button press, call a pure function to parse the file (reuse or extend existing parser).
- Log the parsed structure to the VS Code console using `JSON.stringify(result, null, 2)` for readability.
- The play button is always visible in ".brainy.md" files, regardless of file size or content validity.
- Use only a play icon for the button; no additional accessibility or UI/UX requirements.
- Place all new code in `packages/vscode-extension/src/markdown/`.
- Add or update a README file in the module to document the play button, parser usage, and integration details.
- Example files:
  - `playButton.ts` (UI logic for play button)
  - `playbookParser.ts` (parsing logic, pure function)
  - `playButton.test.ts`, `playbookParser.test.ts` (unit tests)
  - `README.md` (module documentation)

## Definition of Done
- Play button is visible inside the editor on the first line of ".brainy.md" files.
- Clicking the play button parses the current file and logs the parsed structure to the console as pretty-printed JSON.
- All code is placed in `src/markdown/` and follows project guidelines.
- Unit tests cover button rendering, click handling, and parser output, including edge cases.
- README file is created or updated to document the feature and usage.
- Implementation is reviewed and approved by stakeholders.


## Error Display for Parser Errors
- When the play button is pressed and the parser returns errors:
  - Highlight the affected text in the editor using inline decorations (e.g., red underline or background).
  - Show the error message as a tooltip when the user hovers over the highlighted text.
- Use VS Code’s `TextEditorDecorationType` API for decorations and tooltips.
- No Problems panel or additional UI elements are required for this story.

## Code Examples

### Register Play Button in Markdown Editor
```typescript
import * as vscode from 'vscode';

export function registerPlayButton(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('brainy.playbook.parse', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        const content = editor.document.getText();
        const result = parsePlaybook(content); // see below
        console.log('Parsed playbook:', result);
      }
    })
  );

  vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100).text = '$(play) Parse Playbook';
  // For toolbar integration, use VS Code's editor toolbar API (see docs)
}
```

### Pure Parser Function Example
```typescript
import { parseAnnotations } from '../parser';

export function parsePlaybook(markdown: string) {
  // Reuse the annotation parser
  const result = parseAnnotations(markdown);
  // Optionally, transform or filter result as needed
  return result;
}
```

### Test Example for Play Button
```typescript
import { describe, test, expect } from 'vitest';
import { registerPlayButton } from './playButton';

describe('registerPlayButton', () => {
  test('should register command and parse markdown', () => {
    // Mock VS Code API, simulate button click, assert parser is called
    // ...test logic...
    expect(true).toBe(true); // Replace with real assertions
  });
});
```

## Testing
- Unit tests for button rendering, click handling, and parser output.
- Edge case tests for malformed Markdown and empty files.

## Risks & Edge Cases
- UI clutter or performance impact.
- Handling very large Markdown files.

## References
- Epic ticket
- Existing parser implementation
- VS Code extension API docs
- Developing guideline
