# Sample Brainy Playbook

This is a sample playbook file to test the play button feature. Click the play button on line 1 to parse this playbook.

@model "gpt-4.1"
@context "main" "research"

@task --prompt "Research the topic and summarize key points" --variable "research_result"

```bash
echo "Executing script..."
find . -name "*.md"
```

<!-- This is a comment -->

@task "Analyze the research findings"

Some plain text describing the next steps.

@context "specifications"

@task
  --prompt "Write a technical specification based on the research"
  --variable "technical_spec"

```python
# Sample Python code
print("Processing data...")
data = [1, 2, 3, 4, 5]
result = sum(data)
print(f"Result: {result}")
```

@task "Review and validate the specification"
