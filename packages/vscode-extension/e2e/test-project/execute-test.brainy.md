# Execute Skill Test Playbook

This playbook tests the @execute skill with both JavaScript and TypeScript implementations.

## Test JavaScript Execute Skill

@execute

```javascript
console.log('Testing JavaScript execution');
const result = 2 + 2;
console.log('Result:', result);
```

## Test TypeScript Execute Skill

@execute

```typescript
const message: string = 'Testing TypeScript execution';
console.log(message);
const sum: number = 5 + 3;
console.log('Sum:', sum);
```

## Test Execute with Code Block

@execute

```javascript
// Simple hello world test
console.log('hello world');
```

## Additional Context

This playbook is used for e2e testing to verify that:
- The @execute annotation is recognized and highlighted
- Skills can be invoked from playbooks
- Both .js and .ts skills return 'hello world' output
- The skill runner properly handles API injection
