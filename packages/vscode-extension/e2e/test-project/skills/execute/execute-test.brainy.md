# Execute Skill Test

Test the execute skill for running code blocks.

## Test 1: TypeScript execution

@execute
```typescript
const result: number = 2 + 2;
console.log('Result:', result);
```

## Test 2: TypeScript execution with file creation (tests working directory)

@execute
```typescript
import * as fs from 'fs';
import * as path from 'path';

const testFile = path.join(process.cwd(), '.brainy', 'temp', 'execute-test-output.txt');
const dir = path.dirname(testFile);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(testFile, 'TypeScript execution successful!');
console.log('File written to:', testFile);
console.log('Working directory:', process.cwd());
```
