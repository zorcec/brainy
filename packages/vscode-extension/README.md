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

## Skill Development: Using SkillApi

Brainy skills use the `SkillApi` interface for interacting with LLMs and managing models. Here are basic usage patterns:

### Basic Skill Structure

```typescript
import { Skill, SkillParams, SkillApi } from '../types';

export const mySkill: Skill = {
  name: 'my-skill',
  description: 'Brief description of what the skill does',
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    // Skill implementation
    return 'result string';
  }
};
```

### Sending Requests to LLMs

```typescript
const response = await api.sendRequest('user', 'Summarize: ...', 'gpt-4o'); // if model is omited it will use the preselected or default one (that is prefered)
```

### Selecting a Model

```typescript
await api.selectChatModel('gpt-4o');
```

For more advanced examples and testing patterns, see:
- [`information/tickets/008-skills-system-expansion/skillapi-usage-examples.md`](../../information/tickets/008-skills-system-expansion/skillapi-usage-examples.md)

## License
MIT
