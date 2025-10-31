---
description: "Required use-cases and features for the Brainy skills parser."
keywords: ["brainy", "parser", "skills", "workflow", "annotations", "context", "automation"]
date: "2025-10-30"
---

# Brainy Skills Parser: Required Use-Cases


## Supported Annotation Situations

The Brainy parser must support the following annotation patterns and situations:

### 1. Single-Line Annotation with Flags
```
@annotation_name --flag1 value1 --flag2 value2
```

### 2. Multi-Line Annotation Block
```
@annotation_name
   --flag1 value1
   --flag2 value2
```

### 3. Flags with Quoted Values or Multiple Values
```
@annotation_name --flag1 "value with spaces" --flag2 value2
@annotation_name
   --flag1 "value with spaces"
   --flag2 value2
```

### 4. Inline Comments
```
@annotation_name --flag1 value1 <!-- comment -->
@annotation_name
   --flag1 value1
   <!-- comment -->
   --flag2 value2
```

### 5. Variable and Parameter Substitution
```
@task --prompt "Do something with {{variable}}"
```

### 6. All annotation types
Supports all annotation types, including:
- @task
- @context
- @model
- @execute
- @link
- @gh-copilot-context
- ...and any future custom annotation

### 7. Single Line Comments
```
// This is a comment
```

### 8. Code Execution Blocks
```
@execute
   ```bash
   echo "Hello World"
   ```
```

### 9. File Operations
```
@execute
   ```bash
   echo "{{technical_specification}}" > ./output/api_authentication_spec.md
   ```
```

### 10. Context Combination
```
@context "name1" "name2"
```

---

## Unified Output Structure

All annotation situations must be parsed into the following structure:
```js
{
   name: "annotation_name",
   flags: [
      {
         name: "flag1",
         value: "value1"
      },
      {
         name: "flag2",
         value: "value2"
      }
      // ...more flags
   ]
   // Optionally, comments or metadata can be included if needed
}
```
- Flags can be single or multi-line, with or without quotes.
- Comments are ignored for parsing, but can be captured as metadata if required.
- Variable/parameter substitution is handled in flag values.

---

## Use-Cases


## Recommended Annotation Extraction Workflow (Regex Preferred)

For Brainy annotation parsing, the preferred method is to use regular expressions for extracting annotation blocks and flags. This approach is simple, fast, and works well for the annotation patterns used in Brainy workflows.

### Step-by-Step Regex Extraction

1. **Detect annotation lines:**
    - Use a regex to find lines starting with `@` (e.g., `@task`).
    - Example: `/^@(\w+)/`

2. **Extract the annotation name:**
    - Capture the name after `@` (e.g., `task`).

3. **Extract flag lines:**
    - Find lines starting with `--` (e.g., `--variable test`, `--prompt "text"`).
    - Example: `/^--(\w+)\s+("[^"]+"|[^\s]+)$/`

4. **Split flags into name and value:**
    - For each flag, the name is after `--`, and the value is the remainder (handle quoted strings).

### Example Extraction Logic
```js
const annotationRegex = /^@(\w+)/;
const flagRegex = /^--(\w+)\s+("[^"]+"|[^\s]+)$/;

function parseAnnotationBlock(lines) {
   let result = {};
   for (const line of lines) {
      const annoMatch = annotationRegex.exec(line);
      if (annoMatch) {
         result.name = annoMatch[1];
         result.flags = {};
         continue;
      }
      const flagMatch = flagRegex.exec(line);
      if (flagMatch) {
         result.flags[flagMatch[1]] = flagMatch[2].replace(/^"|"$/g, '');
      }
   }
   return result;
}
```

### Why Regex is Preferred
- Handles both single-line and multi-line annotation blocks.
- Easy to maintain and extend for new flags or annotation types.
- Fast and does not require a full markdown AST for simple annotation extraction.

**Agents should use this regex-based approach for annotation parsing unless more complex markdown structures require AST traversal.**
1. **Model Selection**
   - Parse `@model "model-name"` to select the LLM for agent prompts.

2. **Context Management**
   - Parse `@context "name"` to start or switch to a named context.
   - Parse `@context "name1" "name2"` to combine multiple contexts.
   - Handle default context if none is specified.

3. **Task Annotation**
   - Parse `@task "prompt text"` for agent instructions.
   - Parse `@task --variable varName --prompt "prompt text"` for variable assignment and prompt specification.
   - Support parameter substitution (e.g., `{{topic}}`, `${relevant_specs}`).

4. **Code Execution**
   - Parse `@execute` followed by a code block (e.g., Bash) for script execution.

5. **File Operations**
   - Parse code blocks for file operations (e.g., `echo "{{technical_specification}}" > ./output/api_authentication_spec.md`).

6. **Linking and References**
   - Parse `@link "./path/to/file.md"` to include external markdown or reference files.

7. **Comments and Metadata**
   - Parse inline comments (`<!-- ... -->`) for documentation and metadata.

8. **Variable Handling**
   - Parse variable assignment and substitution within prompts, code blocks, and file operations.

9. **Parameter Passing**
   - Support workflow parameters (e.g., `{{topic}}`) passed into tasks and prompts.

10. **Context Combination**
    - Parse and combine multiple contexts for tasks requiring broader context.

---

These use-cases ensure the parser can handle all annotation types, context management, code execution, variable handling, and linking required for reliable skill authoring and execution in Brainy.
## Simple File Parser Concepts & Patterns

### File Access in VS Code Extensions
- Use `vscode.workspace.openTextDocument` and `vscode.workspace.fs.readFile` for reading files.
- Always use VS Code APIs for compatibility with remote/virtual workspaces.

### Parsing Structured Text (Markdown, YAML, Code)
- For Markdown: Use [remark](https://remark.js.org/) to parse into an AST, inspect, and transform annotation blocks.
- For YAML: Use [yaml](https://eemeli.org/yaml/) (`YAML.parse(str)`) for config and context files.
- For JS/TS: Use [acorn](https://github.com/acornjs/acorn) for code parsing and AST traversal.

### Annotation-Based Parsing
- Use regex or AST traversal to find custom tags (e.g., `@task`, `@context`, `@execute`).
- Example (Markdown with remark):
   ```js
   import { unified } from 'unified'
   import remarkParse from 'remark-parse'
   const tree = unified().use(remarkParse).parse(markdownString)
   // Traverse tree for custom annotation nodes
   ```
- Example (YAML):
   ```js
   import YAML from 'yaml'
   const data = YAML.parse(yamlString)
   // Access keys, values, comments, anchors, etc.
   ```

### Context Management
- Store parsed context fragments in a JS object or Map.
- Provide API: `append(name, content)`, `get(name)` for context operations.

### Extensible Architecture
- Use plugin systems (remark plugins, acorn plugins) to add new annotation handlers.
- Modularize: core parser + annotation plugins.

### Error Handling
- Validate input, handle malformed files gracefully.
- Use try/catch and log errors for diagnostics.

### Integration Patterns
- Expose parsed annotation data and context via a clean API for agentic workflows.
- Use async/await for non-blocking file and parsing operations.

---

#### References
- [VS Code Extension API: File System](https://code.visualstudio.com/api/references/vscode-api#FileSystem)
- [remark (Markdown parser)](https://remark.js.org/)
- [yaml (YAML parser)](https://eemeli.org/yaml/)
- [acorn (JS parser)](https://github.com/acornjs/acorn)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
