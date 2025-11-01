## Title
Implement generic annotation highlighting for all skills in playbooks

## Problem
Skill annotations (e.g., `@execute`, `@customSkill`) in playbooks are not consistently highlighted. This makes it hard for users to visually identify and work with skills, especially as new skills are added. Lack of highlighting reduces usability and developer experience. Highlighting all annotations can be noisy; ideally, only available/registered skills should be highlighted.

## Solution
Add a dynamic annotation highlighting mechanism to the playbook execution engine. Only skill annotations that match available/registered skills in the workspace should be highlighted. This ensures new and custom skills are visually distinct, and prevents over-highlighting unrelated annotations.

## Proposal
- Move the skills directory to `.brainy/skills` for consistency and configurability.
- Scan `.brainy/skills` to build a list of available skill names (case-sensitive).
- Update the semantic tokens provider to highlight only annotation lines matching available skill names (case-sensitive).
- Watch `.brainy/skills` for file changes using VS Code's file system watcher and refresh highlighting live as skills are added/removed.
- When a skill is referenced but not available, show a visible editor error (not just a log).
- For multi-line flags, highlight all flag tokens and their values, but only the relevant text (not the whole line or background).
- All highlighting should change only the text color; background remains unchanged.
- Register the provider for `.brainy.md` files and markdown files.
- Add tests to verify highlighting for multiple skill annotations, including dynamic updates when skills are added/removed.
- Document the dynamic highlighting behavior for skill annotations.

## Acceptance Criteria
- Only available/registered skill annotations (case-sensitive) in `.brainy/skills` are highlighted in playbooks.
- Highlighting updates automatically and live when new skills are added or removed (using VS Code watcher).
- Editor error is shown for missing skill references.
- All flag tokens and their values are highlighted (text color only, not background).
- Tests confirm highlighting for multiple skills and dynamic updates.
- Documentation is updated to describe dynamic annotation highlighting and error handling.

## Tasks/Subtasks
- [ ] Move skills directory to `.brainy/skills` and update scanning logic
- [ ] Scan `.brainy/skills` for available skill names (case-sensitive)
- [ ] Update semantic tokens provider for dynamic skill annotation detection
- [ ] Watch `.brainy/skills` for file changes and refresh highlighting live
- [ ] Show editor error for missing skill references
- [ ] Highlight all flag tokens and their values (text color only)
- [ ] Register provider for `.brainy.md` and markdown files
- [ ] Add tests for multiple skill annotation highlighting and dynamic updates
- [ ] Update documentation

## Open Questions
- Are there edge cases (e.g., nested annotations, comments) to consider?
- How should flag highlighting handle complex/malformed cases?

id,name,email,signup_date,status
## Additional Info
- Risks: Over-highlighting non-skill annotations if not filtered.
- Testability: E2E and unit tests for annotation highlighting.

## Relevant Code Examples & Change Locations

**1. Move skills directory to `.brainy/skills` and scan for available skills**
```typescript
// src/skills/skillScanner.ts
import * as fs from 'fs';
import * as path from 'path';

export function getAvailableSkills(workspaceRoot: string): string[] {
	const skillsDir = path.join(workspaceRoot, '.brainy', 'skills');
	if (!fs.existsSync(skillsDir)) return [];
	return fs.readdirSync(skillsDir)
		.filter(f => f.endsWith('.js') || f.endsWith('.ts'))
		.map(f => path.basename(f, path.extname(f))); // skill name is filename (case-sensitive)
}
```

**2. Watch `.brainy/skills` for live updates**
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { getAvailableSkills } from './skills/skillScanner';

let availableSkills: string[] = [];

function refreshSkills(workspaceRoot: string) {
	availableSkills = getAvailableSkills(workspaceRoot);
	// Trigger semantic tokens refresh if needed
}

export function activate(context: vscode.ExtensionContext) {
	// ...existing code...
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
	refreshSkills(workspaceRoot);

	const skillsWatcher = vscode.workspace.createFileSystemWatcher('**/.brainy/skills/*');
	skillsWatcher.onDidCreate(() => refreshSkills(workspaceRoot));
	skillsWatcher.onDidDelete(() => refreshSkills(workspaceRoot));
	skillsWatcher.onDidChange(() => refreshSkills(workspaceRoot));
	context.subscriptions.push(skillsWatcher);
	// ...existing code...
}
```

**3. Update semantic tokens provider for dynamic skill annotation detection**
```typescript
// src/markdown/annotationHighlightProvider.ts
import { availableSkills } from '../extension'; // or inject via context

function addBlockTokens(builder, document, block) {
	// Only highlight if block.name is in availableSkills (case-sensitive)
	if (availableSkills.includes(block.name)) {
		// ...highlight annotation as before...
	}
	// ...existing code for flags...
}
```

**4. Show editor error for missing skill references**
```typescript
// src/parser/index.ts
if (startsWith(trimmedLine, '@')) {
	const skillName = extractSkillName(trimmedLine);
	if (!availableSkills.includes(skillName)) {
		errors.push({
			line: currentLineNumber + 1,
			type: 'MissingSkill',
			message: `Skill "${skillName}" not found in .brainy/skills.`,
			severity: 'error',
			context: skillName
		});
	}
	// ...existing annotation parsing...
}
```

**5. Highlight all flag tokens and their values (text color only)**
```typescript
// src/markdown/annotationHighlightProvider.ts
for (const flag of block.flags) {
	if (flag.position) {
		addToken(builder, flag.position.line, flag.position.start, flag.position.length, 'flag');
	}
	if (flag.valuePositions) {
		for (const valuePos of flag.valuePositions) {
			addToken(builder, valuePos.line, valuePos.start, valuePos.length, 'flag');
		}
	}
}
```

**6. Update documentation**
```markdown
### Dynamic Skill Annotation Highlighting

- Only skills found in `.brainy/skills` are highlighted.
- Highlighting updates live as skills are added/removed.
- Missing skill references show an editor error.
- Flags and their values are highlighted (text color only).
```

**Files to change:**
- `src/skills/skillScanner.ts` (new or updated)
- `src/extension.ts`
- `src/markdown/annotationHighlightProvider.ts`
- `src/parser/index.ts`
- `README.md` (documentation)
## References

- [Project Overview](../../information/project/overview.md)
- [Playbook Execution Engine Epic](../epic.md)

