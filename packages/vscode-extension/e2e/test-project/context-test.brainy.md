# Context Manipulation Test Playbook

Test context manipulation with token limits and validation.

## Test 1: Basic context selection

@context --name "test-context"

```typescript
return { message: "Context set successfully" };
```

## Test 2: Switch contexts

@context --name "ctx1"

```typescript
return { message: "Switched to ctx1" };
```

## Test 3: Token limit enforcement (small model)

@model --id "gpt-4"

@context --name "token-test"

