# Context Manipulation Test Playbook

Test context manipulation with token limits and validation.

## Test 1: Basic context selection

@context --name "test-context"

@execute --name "verify-context"

```typescript
return { message: "Context set successfully" };
```

## Test 2: Multiple contexts

@context --names "ctx1,ctx2,ctx3"

@execute --name "verify-multiple-contexts"

```typescript
return { message: "Multiple contexts set" };
```

## Test 3: Token limit enforcement (small model)

@model --id "gpt-4"

@context --name "token-test"

@execute --name "add-large-content"

```typescript
// This would add a large message that exceeds token limits
return { message: "Large content added" };
```

## Test 4: Duplicate context names (should fail)

@context --names "dup1,dup2,dup1"

@execute --name "should-not-reach"

```typescript
return { message: "This should not execute" };
```
