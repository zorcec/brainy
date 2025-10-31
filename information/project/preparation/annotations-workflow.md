---
description: "Brainy workflow example: research, spec writing, implementation, and testing using deterministic and agentic steps."
keywords: ["brainy", "workflow", "example", "spec", "test", "LLM", "automation"]
date: "2025-10-30"
---

# Example: Research, Spec, Implement, Test Workflow

@model "gpt-4.1" 
<!-- gpt-4.1 is the default model used for agent prompts. -->

@context "main" 
<!-- All text and output after this line is in the 'main' context, which is the default context if not specified. -->

You're a senior software engineer tasked with developing an API authentication module. The workflow involves researching best practices, identifying relevant specifications, writing a technical specification, implementing the module, and running tests.

## Start with the research
@task "Research {{topic}} online and summarize key points, technologies, and best practices."
<!-- {{topic}} is a parameter passed to the workflow -->

@context "specifications" 
<!-- Clean context for specification analysis -->

## Find out the relevant specifications
You're a specification analyst. Based on the research about ${topic}, identify relevant technical specifications that should be considered for the API authentication module.

@execute
  ```bash
  find ./specs -type f -name "*.md"
  ```

@task 
 --prompt "Check which specifications are relevant to the {{topic}}. And summarize only what is relevant."
 --variable relevant_specs
<!-- {{topic}} is a parameter passed to the workflow -->

## Write the technical specification
@context "research" "another_context" 
<!-- Combine contexts to provide full context for spec writing -->

@link "./references/implementation-guidelines.md"
<!-- link will load the md file into the context -->

@task 
  --prompt "Write a technical specification for an API authentication module based on the research and relevant specifications. Use markdown format. Relavant specifications: ${relevant_specs}."
  --variable technical_specification

## Write the specification to a file
```bash
echo "{{technical_specification}}" > ./output/api_authentication_spec.md
```
