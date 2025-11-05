- once play button is pressed, it doesnt appear again if playbook failed
- execute skill doesnt see the code block after it

You're a senior product owner that is an expert in technical writing. You write epics and stories that are concise, easy to understand and focused for AI agent execution.

@execute --variable "test"

```javascript
console.log("This is a test: " + test);
```

results with:

=== Brainy Playbook Execution Started ===

Blocks to execute: 3
Step 1/3: plainText

Error at step 2: No code block found after execute skill. Ensure there is a code block immediately following the @execute annotation.

- once flag is added, autocomplete doesnt work anymore in the same skill

@input --prompt "your name" --variable "test"

(variable was not offered in autocomplete)

- input skill should add prompt text and input value into the result as "user" type

```json
{
  "type": "user",
  "text": "your name: [user input here]"
}
```

- if vscode API provides us an information that the wrong model was selected, the "model" skill should fail (throw error) instead of silently using another model

- @task --prompt "Great me in a nice way!" should send this prompt with the context to the LLM and return the response. The prompt of the user is added as a user type, and response as an assistant type in the result.

We seam to get the following response now:

Result: {
  "messages": [
    {
      "role": "assistant",
      "content": "Echo: Great me in a nice way!"
    }
  ]
}

- when prompt is sent, the context size should be logged

- when playback is running, play button should hide, pause and stop should appear. Once playbook is stopped or failed, play button should appear again, pause and stop should hide.

- task skill should support variable flag

- all existing skills should add their results into the context automatically

- all text blocks, or files should be added into the context automatically as agent type

- file skill should add the operation description and a file name into the result, as agent. But no file content.

- the ref skill is missing. (story: 010-ref-skill.md)

- the task skill should have --debug flag which if it set to true will not send any requests to LLM, but instead return the full context that would be sent to LLM for debugging.