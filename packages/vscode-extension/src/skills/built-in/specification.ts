/**
 * Module: skills/built-in/specification.ts
 *
 * Description:
 *   Built-in specification skill for Brainy.
 *   Allows users to input or edit large text content (specifications, documentation, etc.).
 *   Opens an untitled markdown document for editing with optional prefilled content.
 *   Stores the final content in a variable or adds it to the current context.
 *   Supports the --content flag for prefilling the document with initial text.
 *
 * Usage in playbooks:
 *   @specification --variable mySpec
 *   @specification --variable spec --content "# Initial content\n\nEdit this..."
 *   @specification --context
 *
 * Parameters:
 *   - variable: Variable name to store the content (optional, mutually exclusive with context)
 *   - context: Whether to add content to current context as assistant message (optional, mutually exclusive with variable)
 *   - content: Initial content to prefill the document (optional)
 *
 * Behavior:
 *   - Opens an untitled markdown document with optional prefilled content
 *   - Shows the document to the user for editing
 *   - Waits for user to confirm completion (modal dialog)
 *   - Stores final content in variable or adds to context
 *   - Closes the document without saving
 *   - Throws error if user cancels or if parameters are invalid
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';

/**
 * Specification skill implementation.
 * Opens a text document for editing and stores the result.
 */

export const specificationSkill: Skill = {
  name: 'specification',
  description: 'Open a text document for editing large content (specifications, documentation). Adds content to context and optionally to a variable.',
  params: [
    { name: 'variable', description: 'Variable name to store the content', required: false },
    { name: 'content', description: 'Initial content to prefill the document', required: false }
  ],
  async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
    const { variable, content } = params;

    // Validate variable name if provided
    if (variable !== undefined && (typeof variable !== 'string' || variable.trim() === '')) {
      throw new Error('Missing or invalid variable name');
    }

    // Open text document with optional content
    let finalContent: string;
    try {
      finalContent = await api.openTextDocument(content, 'markdown');
    } catch (error) {
      // Re-throw with clearer message
      if (error instanceof Error && error.message.includes('cancelled')) {
        throw new Error('User cancelled document editing');
      }
      throw error;
    }

    // If variable is specified, also store content in variable
    if (variable) {
      api.setVariable(variable, finalContent);
      return {
        messages: [{
          role: 'agent',
          content: `Specification added to context and stored in variable: ${variable}`
        }]
      };
    } else {
      return {
        messages: [{
          role: 'agent',
          content: 'Specification added to context'
        }]
      };
    }
  }
};
