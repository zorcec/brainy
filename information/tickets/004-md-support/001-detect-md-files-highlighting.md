# Title
Detect Markdown Files in Workspace & Highlight Playbook Annotations

## Context
The VS Code extension must automatically detect `.md` files and provide basic syntax highlighting for playbook annotations (e.g., `@context`, `@task`, etc.) to improve visibility and usability.

## Goal
- Detect all Markdown files in the workspace.
- Highlight playbook-specific annotations in the editor.
- Use the VS Code Semantic Token Provider API for annotation highlighting. This approach is simple, extensible, and maintainable. All logic is in TypeScript, using pure functions and unit tests.

## Implementation Plan
- Use VS Code’s file system API to watch for `.md` files and trigger highlighting logic only for Markdown documents.
- Register a Semantic Token Provider for the `markdown` language in `src/extension.ts`.
- In `annotationHighlightProvider.ts`, implement the provider using pure functions:
  - Call the regex-based parser to extract annotation blocks, flags, and errors.
  - Map parser output to semantic tokens using `SemanticTokensBuilder`, ensuring tokens are single-line and non-overlapping.
  - Highlight all annotation types, including future/custom ones, as provided by skill logic.
  - For parser errors, highlight affected text as 'error' and display an error message inline (e.g., tooltip).
  - Use a distinct, non-intrusive color for custom tokens, consistent across the extension.
- Place all new code in `packages/vscode-extension/src/markdown/`.
- Add or update a README file in the module to document the highlighting logic, parser integration, and usage details.
- Add unit tests next to each module (e.g., `annotationHighlightProvider.test.ts`) to cover correct, incorrect, and edge-case annotation patterns.
- Update documentation in `src/parser/README.md` to mention highlighting support and integration.
- Test with multiple themes to verify highlighting fidelity and fallback behavior.
- Keep logic stateless and efficient; avoid caching or heavy computation in the provider.
- Add E2E tests as a future story for UI-level validation.

## Definition of Done
- All annotation types (including future/custom) are highlighted in Markdown files.
- Parser errors are highlighted inline with both color and error message.
- No multi-line or overlapping tokens; all tokens are single-line and non-overlapping.
- Highlighting is consistent, non-intrusive, and works across multiple themes.
- Unit tests cover all major code paths, edge cases, and error scenarios.
- README file is created or updated to document the feature and usage.
- Documentation is updated to reflect highlighting logic and integration.
- Code is stateless, efficient, and follows project guidelines.
- Implementation is reviewed and approved by stakeholders.

### Compatibility & Mapping
- The parser returns blocks with line/character positions and types. These can be mapped to semantic tokens using VS Code’s `SemanticTokensBuilder`.
- Minor adaptation may be needed to convert parser output to the delta-encoded format required by the semantic token API (see VS Code docs for details).
- The parser’s output is generic and future-proof; new annotation types are automatically supported if the parser logic is updated.

### Edge Cases & Genericity
- All annotation edge cases (multi-line, nested, malformed) are covered by the parser and thus by the highlighting logic, since the provider uses the same parsing function.
- If the parser encounters errors (e.g., malformed annotation), these errors can be surfaced as inline error highlights in the editor.
- The approach is generic: new annotation types or syntax changes only require parser updates, not changes in the highlighting provider.

### Error Handling
- Overlapping or ambiguous annotation patterns are handled by the parser. If errors are returned, the provider can highlight these as errors inline.

### Test Coverage
- Focus on unit tests for both correct and incorrect annotation patterns.
- Add an E2E tests section to the epic; E2E tests will be implemented as a new story at the end. (information/tickets/004-md-support/epic.md)

### Semantic Token API Limitations (Online Research)
- Tokens cannot be multiline; each token must be on a single line.
  - If the parser detects multi-line annotations, split them into single-line tokens for highlighting.
- Overlapping tokens are not supported; tokens must not overlap in the same range.
  - Ensure parser output does not produce overlapping ranges for different annotation types.
- Highlighting fidelity depends on theme support for custom token types.
  - Test with multiple themes to verify colors; fallback to default if unsupported.
- The semantic token provider may be called multiple times during editing; ensure parsing is efficient and stateless.
  - Avoid heavy computation or stateful logic in the provider.
- Error tokens can be defined in the legend and used to highlight parser errors inline.
  - Map parser errors to 'error' tokens for immediate user feedback.
- See [Semantic Highlight Guide](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide) and [API Reference](https://code.visualstudio.com/api/references/vscode-api#DocumentSemanticTokensProvider) for details.

## Highlighting Code Example
```typescript
import * as vscode from 'vscode';
import { parseAnnotations } from '../parser'; // Reuse parser logic

const legend = new vscode.SemanticTokensLegend(['annotation', 'flag', 'error'], []);

export class AnnotationHighlightProvider implements vscode.DocumentSemanticTokensProvider {
  provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens {
    // Use parseAnnotations to extract annotation tags and positions
    // Map parser output to semantic tokens
    // Highlight errors as 'error' tokens
    // ...implementation...
    return new vscode.SemanticTokens(/* ...tokens... */);
  }
}

// Register in extension.ts
vscode.languages.registerDocumentSemanticTokensProvider(
  { language: 'markdown' },
  new AnnotationHighlightProvider(),
  legend
);
```

### Highlighting Rules & Clarifications
- All annotation types—including future and custom ones—should be highlighted. The skill logic will provide the supported annotation names in the future.
- If an annotation and a parser error overlap, error highlighting takes priority. The affected text should be highlighted as an error.
- For custom tokens, use a distinct, non-intrusive color that is commonly used for such cases. No specific color preference; keep it consistent across the extension.
- When highlighting parser errors, display both inline color and an error message (e.g., tooltip or inline text) for clarity.
- No annotation patterns (including deeply nested or edge-case syntax) are excluded from highlighting. Keep logic as simple as possible and connect directly to the parser output.

### Multi-line Annotation Highlighting Example
Suppose the following annotation spans multiple lines:
```
@task
  --prompt "Do something important"
  --flag value
```
Since semantic tokens cannot be multiline, each line will be highlighted separately:
- Line 1: `@task` (highlighted as annotation)
- Line 2: `--prompt "Do something important"` (highlighted as flag)
- Line 3: `--flag value` (highlighted as flag)

This may visually break up the annotation, but ensures each part is highlighted according to its type.

### Error Message Display
- Error messages for parser errors will be shown as inline tooltips (hover messages) only.
- When the user hovers over highlighted error text, the error message will appear.
- No Problems panel, inline text, or status bar notifications will be used for error reporting in this story.
