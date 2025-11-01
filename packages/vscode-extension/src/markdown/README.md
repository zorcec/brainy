# Markdown Annotation Highlighting

This module provides syntax highlighting for Brainy playbook annotations in Markdown files using VS Code's Semantic Token Provider API.

## Overview

The annotation highlighting provider integrates with the existing markdown parser to provide visual feedback for playbook annotations, flags, and parser errors directly in the VS Code editor.

## Architecture

The module follows a stateless, function-based approach:

1. **Parser Integration**: Uses the existing `parseAnnotations()` function from `../parser` to extract annotation blocks with position metadata
2. **Token Mapping**: Consumes parser-provided token positions (line, start, length) and maps them directly to VS Code semantic tokens
3. **Error Highlighting**: Highlights parser errors inline with distinct colors and provides hover tooltips for error messages

## Key Design Decision: Parser-Driven Positions

The provider **no longer uses regex patterns** for token detection. Instead:

- The parser emits position metadata (`TokenPosition` objects) for annotation names, flag names, and quoted values
- The provider consumes these positions directly from `AnnotationBlock.annotationPosition` and `Flag.position`/`Flag.valuePositions`
- This eliminates regex duplication and ensures single source of truth for token positions
- Simplifies the provider implementation significantly (no manual scanning required)

## Features

- **Generic Annotation Highlighting**: Supports all annotation types (present and future) automatically
- **Flag Highlighting**: Highlights both named flags (`--flag value`) and direct values (`"value"`)
- **Error Highlighting**: Shows parser errors inline with distinct color and hover tooltip
- **Single-Line Tokens**: All tokens are single-line (required by VS Code Semantic Token API)
- **Non-Overlapping**: Ensures no token overlaps (required by VS Code)
- **Theme Compatible**: Works across multiple themes with fallback support

## Token Types

The provider defines the following semantic token types:

- `annotation`: Annotation names (e.g., `@task`, `@context`)
- `flag`: Flag names and values
- `error`: Parser errors and malformed syntax

## Token Modifiers

Currently, no modifiers are used, but the legend is extensible for future needs.

## Usage

The provider is automatically registered for all markdown files when the extension activates:

```typescript
import { AnnotationHighlightProvider } from './markdown/annotationHighlightProvider';

const legend = new vscode.SemanticTokensLegend(['annotation', 'flag', 'error'], []);
vscode.languages.registerDocumentSemanticTokensProvider(
  { language: 'markdown' },
  new AnnotationHighlightProvider(),
  legend
);
```

## Implementation Details

### Single-Line Token Constraint

VS Code's Semantic Token API requires all tokens to be on a single line. Multi-line annotations are automatically split:

```markdown
@task
  --prompt "Multi-line value"
  --flag value
```

Results in separate tokens:
- Line 1: `@task` (annotation)
- Line 2: `--prompt "Multi-line value"` (flag)
- Line 3: `--flag value` (flag)

### Error Handling

Parser errors are highlighted with both:
1. **Color**: Error token type (distinct, non-intrusive color)
2. **Hover Tooltip**: Error message displayed on hover

When an annotation overlaps with a parser error, error highlighting takes priority.

### Performance

The provider is designed to be efficient:
- **Stateless**: No internal state or caching
- **Efficient Parsing**: Reuses the optimized regex-based parser
- **On-Demand**: Only processes visible documents

## Testing

Comprehensive unit tests cover:
- Correct annotation patterns (single-line, multi-line, nested)
- Incorrect/malformed annotations
- Edge cases (deeply nested, overlapping, empty documents)
- Error scenarios (parser errors, invalid syntax)

See `annotationHighlightProvider.test.ts` for test coverage details.

## Play Button for Playbook Execution

This module also provides a play button for `.brainy.md` files that allows users to parse and preview playbook content directly in the editor.

### Features

- **CodeLens Play Button**: Appears on the first line of all `.brainy.md` files
- **Parse and Log**: Clicking the button parses the playbook and displays the result in the output channel
- **Error Highlighting**: Parser errors are highlighted inline with red decorations and hover tooltips
- **Console Logging**: Parsed output is logged to the console as pretty-printed JSON for debugging

### Architecture

The play button feature consists of three main components:

1. **PlaybookCodeLensProvider** (`playButton.ts`): Provides the clickable play button using VS Code's CodeLens API
2. **parsePlaybook** (`playbookParser.ts`): Pure function wrapper around the core parser for playbook execution
3. **Error Decorator**: Highlights parser errors with inline decorations and hover tooltips

### Usage

The play button is automatically registered for all `.brainy.md` files when the extension activates. No user configuration is required.

#### For Users

1. Open any file with the `.brainy.md` extension
2. Look for the "$(play) Parse Playbook" button on the first line
3. Click the button to parse the playbook
4. View the parsed output in the "Brainy Playbook" output channel
5. Hover over any highlighted errors to see error messages

#### For Developers

```typescript
import { PlaybookCodeLensProvider, registerPlaybookCommands } from './markdown/playButton';
import { parsePlaybook } from './markdown/playbookParser';

// Register the CodeLens provider
const provider = new PlaybookCodeLensProvider();
context.subscriptions.push(
  vscode.languages.registerCodeLensProvider(
    { pattern: '**/*.brainy.md' },
    provider
  )
);

// Register the parse command
registerPlaybookCommands(context);

// Use the parser directly
const result = parsePlaybook(markdownContent);
console.log('Parsed playbook:', JSON.stringify(result, null, 2));
```

### Error Handling

When parser errors are encountered:

1. **Inline Decorations**: Affected lines are highlighted with a subtle red background and border
2. **Hover Tooltips**: Error messages are displayed when hovering over highlighted lines
3. **Output Channel**: Full error details are shown in the "Brainy Playbook" output channel
4. **Status Messages**: A warning notification shows the number of errors encountered

### Testing

Comprehensive unit tests cover:

- **PlayButton Tests** (`playButton.test.ts`):
  - CodeLens rendering for `.brainy.md` files
  - No CodeLens for non-`.brainy.md` files
  - Play button placement on first line
  - Command registration and arguments
  - Edge cases (empty files, large files)

- **Parser Tests** (`playbookParser.test.ts`):
  - Valid playbook parsing with annotations, code blocks, and comments
  - Error handling for malformed syntax
  - Multi-line annotation support
  - JSON serialization
  - Performance with large files

### Module Files

- `playButton.ts`: CodeLens provider and command handlers
- `playButton.test.ts`: Unit tests for play button functionality (8+ tests)
- `playbookParser.ts`: Pure parser wrapper function
- `playbookParser.test.ts`: Unit tests for parser wrapper (10+ tests)

## Future Enhancements

- Add E2E tests for UI-level validation (tracked in epic)
- Support for custom annotation types via skill configuration
- Additional token modifiers for more granular highlighting
- Playbook execution (currently only parsing and logging)
- Advanced error reporting with suggested fixes

## References

- [VS Code Semantic Highlight Guide](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide)
- [DocumentSemanticTokensProvider API](https://code.visualstudio.com/api/references/vscode-api#DocumentSemanticTokensProvider)
- [CodeLens Provider API](https://code.visualstudio.com/api/references/vscode-api#CodeLensProvider)
- [Parser Module](../parser/README.md)

