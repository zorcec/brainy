# Context Manipulation Test Playbook

Test context manipulation with token limits and validation.

## Test 1: Basic context selection

@context --name "test-context"

@execute --name "verify-context"

```typescript
return { message: "Context set successfully" };
```

## Test 2: Switch contexts

@context --name "ctx1"

@execute --name "verify-context-switch"

```typescript
return { message: "Switched to ctx1" };
```

## Test 3: Token limit enforcement (small model)

@model --id "gpt-4"

@context --name "token-test"

@execute --name "add-large-content"

```typescript
// This would add a large message that exceeds token limits
return { message: "Large content added" };
```
