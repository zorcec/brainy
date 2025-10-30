---
description: "High-level overview of Brainy: deterministic agent playbooks and VS Code extension. Includes agent context control features."
keywords: ["brainy", "agent playbook", "markdown", "VS Code extension", "context control", "automation", "LLM", "scripts"]
date: "2025-10-30"
---

# Brainy: Deterministic Agent Playbooks in VS Code

## Concept Overview

**Brainy** is a framework and VS Code extension for authoring, managing, and executing agent playbooks using markdown files. These playbooks combine human-readable instructions, agent prompts, and executable code blocks (e.g., Bash, Python, JS) in a single, structured workflow.

### Key Features
- **Markdown-Based Playbooks:** Write `.md` files with step-by-step instructions, agent prompts, and embedded code blocks.
- **Executable Code Blocks:** Code blocks (e.g., Bash, Python) are parsed and executed locally by the extension, allowing automation of scripts, file operations, and custom logic.
- **Agent Integration:** Prompts and context are sent to an LLM (e.g., Copilot, GPT) for reasoning, decision-making, and workflow guidance.
- **Context Chaining:** Outputs from scripts and RAG (Retrieval-Augmented Generation) commands are injected as context for subsequent agent steps.
- **Deterministic Execution:** The extension orchestrates the workflow, ensuring each step (script or agent prompt) is executed in order, with branching and user approval as needed.
- **Flexible Syntax:** Supports custom tags, code blocks, and metadata for advanced workflows.

### Example Workflow
1. **Script Step:**
   ```bash
   cp template.md newfile.md
   ```
   (Copies a template file using Bash.)
2. **Agent Step:**
   ```
   @prompt "LLM, analyze the new file and suggest next steps."
   ```
   (LLM figures out what should be done next.)
3. **RAG Step:**
   ```bash
   ./rag-query.sh --topic "relevant data"
   ```
   (Retrieves relevant data using a local script.)
   or
   ```markdown
   @rag-query --topic "relevant data"
   ```
   (Retrieves relevant data using built-in RAG capabilities.)
4. **Agent Step:**
   ```
   @prompt "LLM, work with the provided context and update the documentation."
   ```
5. **Test Step:**
   ```bash
   ./run-tests.sh
   ```
   (Runs tests and reports results.)

## Motivation & Pain Points

Modern LLMs and tools like GitHub Copilot are powerful, but their outputs are often non-deterministic and hard to reproduce. For complex workflows—such as research, documentation, specification-driven development, and controlled testing—developers need a way to combine deterministic scripts with flexible LLM-powered reasoning.

**Pain Points Addressed:**
- LLMs and Copilot are not always predictable; results can vary between runs.
- Ad-hoc automation and agent flows lack reproducibility and context hygiene.
- Writing specs, implementing features, and running tests require more control than pure chat or code completion.
- Developers want to build workflows that glue together scripts, prompts, and context in a repeatable, inspectable way.

**Brainy Solution:**
- Use `.md` files as agent building blocks—mixing scripts, prompts, and context tags for step-by-step, observable automation.
- Enable deterministic execution with explicit context management, branching, and replay.
- Let LLMs handle reasoning and glue logic, while scripts and playbooks ensure reliability and reproducibility.

## Agent Context Control

Brainy playbooks support advanced control over agent context:
- **Clear Context:** Use a custom tag (e.g., `@context`) to reset the agent's memory before a step.
- **Save and reuse the context:** Use a tag (e.g., `@context "name of the context"`) to open a new, isolated context for a specific block or command.
- **Context Injection:** Outputs from scripts or RAG commands will be injected into the agent's context for subsequent steps.
- **Combining Contexts:** Optionally, combine multiple contexts or chain them for complex workflows.

### Example Syntax

#### Context Control Syntax and Behaviors

You can control agent context in Brainy playbooks using the following explicit patterns:

**Start a new clean context:**
```markdown
`@context`
`@prompt "Start fresh and summarize the current directory."`
```
This starts a new, clean context for the agent. No prior history or previous steps are included.

**Continue in the current context:**
```python
# Some isolated code
print("Hello World")
```
```markdown
`@prompt` "Analyze the output of the previous code block."
```
This prompt and code block are executed in the current context, inheriting any previous state or information.

**Create or reuse a named context:**
```markdown
`@context` "research-context"
`@rag-query` "latest research findings"
`@prompt` "Using the stored context, generate a report."
```
This creates (or reuses, if it already exists) a named context called "research-context". All subsequent steps within this block use the named context, allowing you to isolate workflows or reuse context across steps.

**Summary of context control:**
- `@context` (no name): Start a fresh, empty context.
- `@context "name"`: Start or switch to a named context, which can be reused later.
- Prompts and code blocks after a context tag use that context until another context tag is encountered.
- Contexts can be used to isolate, reset, or chain agent memory and workflow state.

**Other skills:**
- `@task "prompt text"`: Defines a prompt for the agent to respond to.
- `@task --variable`: Output will be stored in a variable for later use.
- `@task --prompt`: Flag to specify the prompt for the agent.
- `@link "./deploy.brainy.md"`: Link to another Brainy playbook to include its context and steps. (will be executed as part of the current playbook)
- `@link "./coding-workflow.md"`: Link to another md file that will be loaded into the context.
- `@link "./diagram.jpg"`: Link to other files will be loaded into the context.
- `@context optimize`: Optimizes the current context for easier understanding by the agent and reduces the size.
- `@context store`: Saves the current context into a file for later reuse.
- `@context restore`: Restores a previously saved context from a file.
- `@model "gpt-4.1"`: Switches the LLM model used for subsequent prompts. (default)
- `{{name}}`: Vriable from previous tasks, or a passed in parameter.
- `//` : Single line comments.
- `@execute`: Execute the code block below and return the output to the agent.
- Interactive scripts executions for the agent (low priority)
- All @ features provide flags, so multiple options can be combined.
- Editor UI
 - play / pause / stop controls for execution for brainy files.
 - Highlight the line that is beng executed
 - Show agent request/reponses and inspect the context

## Extension Architecture
**Markdown Parser:** Scans `.md` files for custom tags and code blocks.
**Execution Engine:** Runs code blocks locally, captures output, and injects results into agent context.
**Agent Orchestrator:** Sends prompts and context to the LLM, receives responses, and manages workflow state.
**UI Integration:** Provides interactive controls, output display, and step navigation in VS Code.
**Security & Sandboxing:** Ensures safe execution of scripts and code blocks.
**Context Manager:** Handles context clearing, isolation, and injection as specified in the playbook.

## Skills System

All annotations (such as `@task`, `@rag-query`, `@context`, etc.) are referred to as **skills** in Brainy.

- Each skill is implemented as a custom script or handler.
- Custom skill scripts must be placed in the `./skills` directory.
- The extension automatically loads and executes skills from this folder, enabling extensibility and user-defined automation.

This ensures that all agent instructions and workflow annotations are consistently managed as skills, with no contradictions in terminology or implementation. All new or custom automation should be added as a skill script in `./skills`.

## Standard Markdown Editor Capabilities

In the standard VS Code markdown editor, you can implement the following features:

- **Highlight the current line or block** using editor decorations (background, underline, gutter icons).
- **Show agent responses or execution status** using CodeLens, inline comments, or status bar messages.
- **Add clickable icons or buttons above lines** using CodeLens or custom decorations.

These features provide basic interactivity and feedback, but for advanced UI and full control over layout, a custom Webview-based markdown preview is required.

## Outcome
You will be able to author markdown playbooks that mix agent instructions and executable code, with fine-grained control over agent context, enabling deterministic, automated, and context-rich workflows in VS Code.