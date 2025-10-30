---
description: "Brainy workflow example: research, spec writing, implementation, and testing using deterministic and agentic steps."
keywords: ["brainy", "workflow", "example", "spec", "test", "LLM", "automation"]
date: "2025-10-30"
---

# Example: Research, Spec, Implement, Test Workflow

## Goal
Automate a research-driven development workflow: gather data, write a spec, implement code, and run tests, using both scripts and LLM agent steps for glue logic and documentation. 
// All above will be inside the initial context, and get lost after we switch it to other contexts.

--- START OF WORKFLOW ---
@model "gpt-4.1"

You're a senior software engineer tasked with developing an API authentication module. The workflow involves researching best practices, identifying relevant specifications, writing a technical specification, implementing the module, and running tests.

## Start with the research
@context "research"
@prompt "Research ${topic} online and summarize key points, technologies, and best practices."

## Find out the relevant specifications
@model "gpt-5"
@context "specifications"
```bash
find ./specs -type f -name "*.md"
```
@prompt relevant_specs "Check which specifications are relevant to the ${topic}. And summarize only what is relevant."

## Write the technical specification
@model "gpt-4.1"
@context "research"
@link "./references/implementation-guidelines.md"
@prompt "Write a technical specification for an API authentication module based on the research and relevant specifications. Use markdown format. Relavant specifications: ${relevant_specs}."

## Summarize complete context
@prompt "Analyze the script response."
@prompt "Summarize the workflow, highlighting what was learned and next steps for the project."

--- END OF WORKFLOW ---