## Title
Simple Performance Benchmark & Validation

## Problem
The parser must reliably handle large markdown files without significant slowdowns or memory issues. Without performance validation, agent workflows may be delayed or fail under real-world loads.

## Solution
Benchmark parser speed and memory usage on large markdown files. The parser returns a ParseResult `{ blocks, errors }`. If the parser returns any errors the playbook will not be executed; benchmarks should include error-free and malformed inputs. Identify bottlenecks and optimize critical code paths. Validate that the parser meets acceptable performance thresholds for typical and worst-case scenarios.

## Proposal
1. Create benchmark scripts to measure parser execution time and memory usage on large markdown files (e.g., 10k+ lines). Benchmarks should be documented in the module README and optionally implemented as Vitest performance tests or standalone Node scripts in `bench/`.
2. Run benchmarks for typical, edge case, and worst-case inputs.
3. Analyze results and identify slow or inefficient code paths.
4. Optimize regex, parsing logic, and data structures as needed.
5. Document benchmark results and any optimizations performed.

## Acceptance Criteria
- Parser is benchmarked on large markdown files and results are documented in `README.md` or `bench/` results.
- Benchmarks include both well-formed inputs and malformed inputs that produce `errors` to validate behavior under error conditions.
- No significant slowdowns or memory issues for files up to a defined threshold (e.g., 10k lines) documented alongside environment details.
- Bottlenecks are identified and optimized.
- Benchmark scripts and results are maintained in the module root and linked from README.
- Performance validation is repeated after major code changes.
- All tests must run successfully before marking this story as done.
 - Consistency rule: if `errors` is non-empty those errors are authoritative and any `blocks` returned must be ignored by the consumer; the playbook will not execute.

## Tasks/Subtasks
- Write benchmark scripts for parser performance and memory usage. (inside vitest tests)
- Run benchmarks on large and edge case markdown files.
- Analyze and optimize slow code paths.
- Document results and optimizations in README.md or a dedicated benchmark file.
- Repeat validation after major changes.

## Open Questions
- What is the acceptable performance threshold (e.g., max execution time, memory usage)?
  - 10k lines should parse within 500ms with memory usage under 50MB.

## Additional Info
- Risks: Unoptimized code may cause delays or failures in production.
- Reviewer should check for benchmark coverage, documentation, and optimizations.

## Example
### Example: Benchmark script
```typescript
import { parseAnnotations } from './parser';
import { readFileSync } from 'fs';

const markdown = readFileSync('large-file.md', 'utf8');
console.time('parse');
const result = parseAnnotations(markdown);
console.timeEnd('parse');
```
