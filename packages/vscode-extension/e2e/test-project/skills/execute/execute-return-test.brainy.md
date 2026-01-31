# Execute Return Statement Test

Test the execute skill with JavaScript return statements and variable assignment.

## Test 1: JavaScript return statement with variable assignment

@execute --variable "returnedValue"
```javascript
return 42
```

## Test 2: Use the returned value to write a file

@execute
```javascript
import * as fs from 'fs';
import * as path from 'path';

// Get the returned value from the previous step
const value = 42; // In actual execution, this would be from context

const testFile = path.join(process.cwd(), '.brainy', 'temp', 'return-test-output.txt');
const dir = path.dirname(testFile);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(testFile, String(value));
console.log('File written with returned value:', value);
```
