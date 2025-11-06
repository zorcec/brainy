# Papercuts Feature Tests

This playbook tests all the papercuts improvements:
- Purple skill highlighting
- Hover information
- Autocomplete
- Validation

## Test 1: Basic skills with purple highlighting

@context --name "test1"

@model --id "gpt-4"

@task --prompt "Test task"

@execute --name "test-execute"

```typescript
return { message: "Test passed" };
```

## Test 2: Model selection

@model --id "gpt-4"

@context --name "model-test"

## Test 3: Context switching

@context --name "ctx1"

## Test 4: Valid complex annotation

@task --prompt "Complex task" --variable "result" --timeout "5000"

## Test 5: Edge case - whitespace handling

@context --name "spaces-test"  

@model --id "claude-3"  

## Test 6: Execute with parameters

@execute --name "param-test" --timeout "3000"

```bash
echo "Testing execution"
```
