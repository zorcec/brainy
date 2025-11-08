/**
 * Module: markdown/skillHoverProvider.ts
 *
 * Description:
 *   Hover provider for displaying skill information in Brainy playbooks.
 *   Shows skill description, usage examples, and available parameters.
 *   Supports both built-in and project-specific skills.
 *
 * Usage:
 *   import { SkillHoverProvider } from './markdown/skillHoverProvider';
 *   vscode.languages.registerHoverProvider(
 *     { language: 'markdown' },
 *     new SkillHoverProvider()
 *   );
 */

import * as vscode from 'vscode';
import { parseAnnotations } from '../parser';
import { getBuiltInSkill, isBuiltInSkill } from '../skills/built-in';
import { isSkillAvailable, isLocalSkill } from '../skills/skillScanner';
import { validateLocalSkill } from '../skills/skillLoader';

/**
 * Hover provider for displaying skill information.
 */
export class SkillHoverProvider implements vscode.HoverProvider {
	/**
	 * Provides hover information for a position in the document.
	 *
	 * @param document - The document to provide hover for
	 * @param position - The position where hover was triggered
	 * @returns Hover with skill information or undefined
	 */
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.Hover | undefined {
		const content = document.getText();
		if (!content?.trim()) {
			return undefined;
		}

		// Parse the document to find annotations
		const parseResult = parseAnnotations(content);
		
		// Find the annotation at the current line (convert to 1-indexed for parser)
		const currentLine = position.line + 1;
		const block = parseResult.blocks.find((b) => b.line === currentLine);

		if (!block) {
			return undefined;
		}

		// Skip non-skill blocks
		const skipTypes = ['plainText', 'plainComment', 'plainCodeBlock'];
		if (skipTypes.includes(block.name)) {
			return undefined;
		}

		// Check if it's an available skill
		if (!isSkillAvailable(block.name)) {
			return undefined;
		}

		// For local skills, validate and show errors if any
		if (isLocalSkill(block.name)) {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (workspaceFolders && workspaceFolders.length > 0) {
				const workspaceRoot = workspaceFolders[0].uri.fsPath;
				const validation = validateLocalSkill(block.name, workspaceRoot);
				
				if (!validation.valid) {
					const markdown = new vscode.MarkdownString();
					markdown.isTrusted = true;
					markdown.appendMarkdown(`## @${block.name} *(Local Skill)*\n\n`);
					markdown.appendMarkdown(`❌ **Validation Error**\n\n`);
					markdown.appendCodeblock(validation.error || 'Unknown error', 'text');
					if (validation.stack) {
						markdown.appendMarkdown(`\n**Stack Trace:**\n`);
						markdown.appendCodeblock(validation.stack, 'text');
					}
					return new vscode.Hover(markdown);
				}
				
				// Valid local skill
				const markdown = new vscode.MarkdownString();
				markdown.isTrusted = true;
				markdown.appendMarkdown(`## @${block.name} *(Local Skill)*\n\n`);
				markdown.appendMarkdown(`✅ Valid local skill from \`.skills/${block.name}.ts\`\n\n`);
				markdown.appendMarkdown(`This is a project-specific skill. Check the source file for documentation.`);
				return new vscode.Hover(markdown);
			}
		}

		// Get skill information for built-in skills
		const skillInfo = getSkillInfo(block.name);
		if (!skillInfo) {
			return undefined;
		}

		// Build hover content
		const markdown = new vscode.MarkdownString();
		markdown.isTrusted = true;
		
		// Skill name and description
		markdown.appendMarkdown(`## @${skillInfo.name}\n\n`);
		markdown.appendMarkdown(`${skillInfo.description}\n\n`);
		
		// Usage examples
		if (skillInfo.examples && skillInfo.examples.length > 0) {
			markdown.appendMarkdown(`### Usage Examples\n\n`);
			for (const example of skillInfo.examples) {
				markdown.appendCodeblock(example, 'markdown');
			}
		}
		
		// Available parameters
		if (skillInfo.parameters && skillInfo.parameters.length > 0) {
			markdown.appendMarkdown(`### Available Parameters\n\n`);
			for (const param of skillInfo.parameters) {
				markdown.appendMarkdown(`- \`--${param.name}\``);
				if (param.required) {
					markdown.appendMarkdown(` *(required)*`);
				}
				if (param.description) {
					markdown.appendMarkdown(`: ${param.description}`);
				}
				markdown.appendMarkdown(`\n`);
			}
		}

		return new vscode.Hover(markdown);
	}
}

/**
 * Skill information structure.
 */
interface SkillInfo {
	name: string;
	description: string;
	examples?: string[];
	parameters?: Array<{
		name: string;
		description?: string;
		required?: boolean;
	}>;
}

/**
 * Gets information about a skill.
 *
 * @param skillName - The name of the skill
 * @returns Skill information or undefined
 */
function getSkillInfo(skillName: string): SkillInfo | undefined {
	// For now, only support built-in skills
	// Project skills can be added later when we have a way to extract their metadata
	if (!isBuiltInSkill(skillName)) {
		return {
			name: skillName,
			description: 'Project-specific skill',
			examples: [`@${skillName}`]
		};
	}

	const skill = getBuiltInSkill(skillName);
	if (!skill) {
		return undefined;
	}

	// Build skill info from the skill object
	const info: SkillInfo = {
		name: skill.name,
		description: skill.description || 'No description available'
	};

	// Add examples and parameters based on skill name
	// This is hardcoded for now, but could be extracted from skill metadata in the future
	switch (skillName) {
		case 'context':
			info.examples = [
				'@context --name "research"',
				'@context --names "research,summary"'
			];
			info.parameters = [
				{ name: 'name', description: 'Single context name', required: false },
				{ name: 'names', description: 'Multiple context names (comma-separated)', required: false }
			];
			break;
		
		case 'model':
			info.examples = [
				'@model --id "gpt-4o"',
				'@model --id "claude-3"'
			];
			info.parameters = [
				{ name: 'id', description: 'Model ID to select', required: true }
			];
			break;
		
		case 'task':
			info.examples = [
				'@task --prompt "Analyze this code"',
				'@task --prompt "Summarize" --variable "summary"'
			];
			info.parameters = [
				{ name: 'prompt', description: 'Prompt text for the task', required: true },
				{ name: 'variable', description: 'Variable name to store the result', required: false }
			];
			break;
		
		case 'execute':
			info.examples = [
				'@execute',
				'@execute --name "process-data"'
			];
			info.parameters = [
				{ name: 'name', description: 'Name for the execution step', required: false }
			];
			break;
	}

	return info;
}
