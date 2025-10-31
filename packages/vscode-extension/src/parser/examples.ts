/**
 * Example usage of the Brainy Markdown Parser
 * 
 * This file demonstrates how to use the parser to extract annotations,
 * flags, comments, and text from markdown playbooks.
 */

import { parseAnnotations } from './index';

// Example 1: Basic annotation parsing
console.log('=== Example 1: Basic Annotation ===');
const example1 = '@task --prompt "Summarize the topic"';
const result1 = parseAnnotations(example1);
console.log(JSON.stringify(result1, null, 2));

// Example 2: Multiple annotations with different patterns
console.log('\n=== Example 2: Multiple Annotations ===');
const example2 = `
@model "gpt-4.1"
@context "main" "research"
@task --prompt "Research {{topic}}" --variable "result"
<!-- This is a comment -->
Some plain text here.
`;
const result2 = parseAnnotations(example2);
console.log(JSON.stringify(result2, null, 2));

// Example 3: Multi-line annotation
console.log('\n=== Example 3: Multi-line Annotation ===');
const example3 = `
@task
   --prompt "Check which specifications are relevant"
   --variable relevant_specs
`;
const result3 = parseAnnotations(example3);
console.log(JSON.stringify(result3, null, 2));

// Example 4: Real-world workflow
console.log('\n=== Example 4: Real-world Workflow ===');
const example4 = `
@model "gpt-4.1"
@context "main"

You're a senior software engineer tasked with developing an API authentication module.

@task "Research {{topic}} online and summarize key points"

@context "specifications"

@task
   --prompt "Check which specifications are relevant to the {{topic}}"
   --variable relevant_specs

@context "research" "specifications"

@task
   --prompt "Write a technical specification for the module"
   --variable technical_specification
`;
const result4 = parseAnnotations(example4);

// Display summary
console.log(`Total blocks: ${result4.blocks.length}`);
console.log(`Annotations: ${result4.blocks.filter(b => !['plainText', 'plainComment'].includes(b.name)).length}`);
console.log(`Plain text: ${result4.blocks.filter(b => b.name === 'plainText').length}`);
console.log(`Comments: ${result4.blocks.filter(b => b.name === 'plainComment').length}`);

// Example 5: Error handling
console.log('\n=== Example 5: Error Handling ===');
const example5 = '@';
const result5 = parseAnnotations(example5);
if (result5.errors.length > 0) {
  console.log('Errors found:');
  result5.errors.forEach(err => {
    console.log(`  - ${err.type}: ${err.message} (line ${err.line})`);
  });
}

// Example 6: Processing blocks
console.log('\n=== Example 6: Processing Blocks ===');
const example6 = `
@model "gpt-4"
@task --prompt "Test" --variable "x"
@context "main"
`;
const result6 = parseAnnotations(example6);

result6.blocks.forEach((block, index) => {
  console.log(`\nBlock ${index + 1}:`);
  console.log(`  Type: ${block.name}`);
  console.log(`  Line: ${block.line}`);
  if (block.flags.length > 0) {
    console.log(`  Flags:`);
    block.flags.forEach(flag => {
      console.log(`    - ${flag.name || '(direct)'}: [${flag.value.join(', ')}]`);
    });
  }
});

console.log('\n=== All Examples Complete ===');
