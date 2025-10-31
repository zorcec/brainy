# Title

Brainy Markdown Skills Parser: Annotation Extraction & Unit Testing

## Blogline (Short Abstract)
Parse any markdown playbook to extract all agent skills, annotations, and workflow blocks as structured objects, enabling custom agent flows and robust unit testing.

## Audience & Stakeholders
- Developers who want to add new skills and create custom agent flows
- Extension maintainers
- QA engineers focused on parser reliability
- Product owners seeking reproducible automation

## WHY
- We need it to support annotation-driven agent workflows
- Enables modular skill extraction for dynamic agent behavior
- Facilitates unit testing of individual skills and annotations

## Functional Requirements
- Parse any markdown file and extract all annotation blocks, code blocks, and text sections as described in parser.md
- Support all annotation patterns: single-line, multi-line, flags, quoted values, comments, variable substitution, code execution blocks, context combination
- Output a unified object containing an array of all important blocks (each annotation, code block, and text in between), with all details per parser.md
- Provide a clean, function-based API for accessing parsed blocks and their metadata.
- Enable detailed unit testing for every supported annotation type, flag, and malformed input (pure functions, input/output based).
- The parser must be generic: it should handle all known and future annotation syntaxes and flags, without hardcoded annotation names or types.
- Parsing must use regular expressions for annotation and flag extraction, as described in parser.md.
- Handle malformed or edge-case markdown gracefully.
 - Return a unified ParseResult object: { blocks: AnnotationBlock[], errors: ParserError[] }.
	 - Important: if parsing returns any errors (non-empty `errors` array), the playbook will not be executed. Implementations should therefore return only errors in the error-first critical cases described in stories (see Error Handling story for details).
 - Annotation names should not be normalized or altered; they must be extracted as-is from the markdown.
 - Consistency rule: if the ParseResult contains any errors, those errors are authoritative and any returned `blocks` are not relevant and must be ignored by the consumer; the playbook will not be executed.

## Non-Functional Requirements
- Performance: Parser should efficiently handle large markdown files (target: 10,000+ lines in under 2 seconds).
- Reliability: Must not crash or hang on malformed or unexpected input; always return a valid result or error object.
- Maintainability: Codebase must be modular, well-documented, and easy to extend for new annotation types and flags.
- Testability: All parsing logic must be covered by automated unit tests, including edge cases and malformed input.

## Success & Completion
- Edge case: malformed markdown, unsupported annotation formats
 - Should be handled gracefully without crashing the parser.
 - Parser should return a valid result or error object indicating the issue.
- Risk: incomplete extraction of annotation flags or code blocks
- Risk: parser performance on very large files
- Open question: How to handle future annotation types and backward compatibility?
 - Future annotations should be easy to add without breaking existing functionality.
 - Basically allowing the new annotation names, the rest of the parser logic has to be generic enough to handle any annotation type.
 - Backward compatibility should be maintained as we go, the tests should reveal any breaking changes.

## Additional information

### Reference Details

- [Project Overview](../../project/overview.md): High-level summary of Brainy’s mission, agent playbook architecture, context control, and key design principles. Provides the conceptual foundation for the parser and its role in the overall system.
- [Annotations Workflow](../../project/preparation/annotations-workflow.md): Describes annotation strategies, supported patterns, and workflow concepts for Brainy playbooks. Essential for understanding the types of annotations and blocks the parser must handle.
- [Parser Implementation](../../project/preparation/parser.md): Contains the technical implementation details, recommended extraction logic, regex patterns, and unified output structure for the parser. This is the primary source for how the parser should be built and function.

## Implementation location

The parser module will be implemented at: `packages/vscode-extension/src/parser/` inside the repository. Document this location in the stories and README.
