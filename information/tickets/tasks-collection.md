
- when prompt skill is executed, the following error happens:
```
Playbook execution failed at step 3: Error: LLM request failed: o.map is not a function at defaultProvider (/root/workspace/brainy/packages/vscode-extension/src/skills/modelClient.ts:193:10) at processTicksAndRejections (node:internal/process/task_queues:105:5)
```
- Skill "file-picker" where file or multiple files can be selected (use vscode API)
- Skill "specification" where user can input large text, basically a virtual .md document. Once close it should pass the content into the variable, or if variable is not specified then add to the context. User type message. This skill also has a "--content" flag to which user can prefill the content of the specification document.
- If multiple contexts are selected, all new messages will be added to all selected contexts. This results in multiple messages sent to LLM. Allow to select only one context at a time. Simplify the whole logic that is related.