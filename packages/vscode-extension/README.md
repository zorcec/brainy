# Brainy VS Code Extension

This extension integrates the Brainy knowledge assistant into Visual Studio Code.

## Features
- Connects to the local Brainy server for hybrid (vector + keyword) search
- Indexes and retrieves Markdown knowledge base files
- Provides commands for configuration and search

## Getting Started
1. Install dependencies and build the project:
   ```bash
   npm install
   npm run build
   ```
2. Launch VS Code and open your workspace.
3. Activate the extension. The Brainy server will start automatically.
4. Use the `Brainy: Configure Workspace` command to set up your knowledge base.

## Requirements
- Node.js 18+
- Brainy server (included in this monorepo)

## Development
- Source code: `src/`
- Unit tests: `src/extension.test.ts`
- E2E tests: `e2e/`

## Local Project Skills

Brainy supports project-specific skills that you can define in your workspace. These skills are automatically discovered and loaded from the `.skills/` folder at the root of your workspace.

### Creating Local Skills

1. Create a `.skills/` folder in your workspace root
2. Add TypeScript files (`.ts`) with your skill implementations
3. Each skill must export an object matching the `Skill` interface:

```typescript
// .skills/my-skill.ts
export const mySkill = {
  name: 'my-skill',
  description: 'Does something useful',
  async execute(api, params) {
    // Your skill logic here
    // Use api.sendRequest() to interact with LLMs
    // Use api.setVariable() to store values
    return { messages: [{ role: 'assistant', content: 'Result' }] };
  }
};
```

### Skill Interface

Skills must implement the following interface:

```typescript
interface Skill {
  name: string;
  description: string;
  execute(api: SkillApi, params: SkillParams): Promise<SkillResult>;
}
```

### SkillApi Methods

The `api` parameter provides access to extension functionality:

- `sendRequest(role, content, modelId?, options?)` - Send requests to LLMs
- `selectChatModel(modelId)` - Select a chat model globally
- `getAllAvailableTools()` - Get all available VSCode language model tools
- `getParsedBlocks()` - Get all parsed blocks from the current playbook
- `getCurrentBlockIndex()` - Get the index of the currently executing block
- `setVariable(name, value)` - Set a variable value
- `getVariable(name)` - Get a variable value
- `openInputDialog(prompt)` - Prompt user for input
- `addToContext(role, content)` - Add a message to the active context
- `getContext()` - Get the current context messages
- `openFileDialog(options)` - Open a file picker dialog
- `openDocumentForEditing(content?, language?)` - Open a document for editing

### Using Local Skills in Playbooks

Once created, local skills can be used in playbooks just like built-in skills:

```markdown
@my-skill --param1 "value1" --param2 "value2"
```

### Skill Management Commands

- **Brainy: List Available Skills** - Shows all available skills (built-in and local)
- **Brainy: Reload Skills** - Rescans the `.skills/` folder and refreshes the skill list

### Skill Validation

The extension automatically validates local skills and shows errors in hover tooltips:
- Hover over a skill annotation to see validation status
- Errors include transpilation errors, syntax errors, and missing exports
- Valid skills show a green checkmark with the skill name

### Example Local Skill

```typescript
// .skills/api-fetch.ts
export const apiFetchSkill = {
  name: 'api-fetch',
  description: 'Fetches data from an API endpoint',
  async execute(api, params) {
    const url = params.url;
    if (!url) {
      throw new Error('URL parameter is required');
    }
    
    const response = await fetch(url);
    const data = await response.text();
    
    // Store in variable if specified
    if (params.variable) {
      api.setVariable(params.variable, data);
    }
    
    return { 
      messages: [{ 
        role: 'assistant', 
        content: `Fetched data from ${url}` 
      }] 
    };
  }
};
```

Use in playbook:
```markdown
@api-fetch --url "https://api.example.com/data" --variable "apiData"
```


## Built-in Skills

Brainy comes with the following built-in skills for use in playbooks and automation:

### context
Switch to or create a named agent context. Stores messages in chronological order and manages token limits.
**Parameters:**
- `name` (string, required): Context name

### model
Set the active LLM model for subsequent requests.
**Parameters:**
- `id` (string, required): Model ID (e.g., 'gpt-4o', 'claude-3')

### task
Send a prompt to the LLM and return the response. Supports variable substitution and storing responses.
**Parameters:**
- `prompt` (string, required): Prompt text
- `model` (string, optional): Model ID
- `variable` (string, optional): Variable name to store response

### execute
Run the next code block in the playbook and capture its output.
**Parameters:**
- `variable` (string, optional): Variable name to store output

### file
Read, write, or delete files using Node.js fs API.
**Parameters:**
- `action` (string, required): 'read', 'write', or 'delete'
- `path` (string, required): File path
- `content` (string, required for write): File content

### input
Prompt the user for input and store it in a variable. Pauses execution until input is provided.
**Parameters:**
- `prompt` (string, required): Prompt text
- `variable` (string, required): Variable name to store input

### file-picker
Open a file/folder picker dialog and store selected paths in a variable.
**Parameters:**
- `variable` (string, optional): Variable name to store selected paths
- `prompt` (string, optional): Prompt text to show to the user

### document
Open a markdown document for user editing and capture content on close.
**Parameters:**
- `variable` (string, optional): Variable name to store document content
- `content` (string, optional): Initial content for the document

### dummy
Dummy skill for testing. Supports success, error, and slow modes.
**Parameters:**
- `mode` (string, optional): 'success', 'error', or 'slow'
- `message` (string, optional): Custom message
- `delay` (number, optional): Delay in ms for slow mode

For more advanced examples and testing patterns, see:
- [`information/tickets/008-skills-system-expansion/skillapi-usage-examples.md`](../../information/tickets/008-skills-system-expansion/skillapi-usage-examples.md)

## License
MIT
