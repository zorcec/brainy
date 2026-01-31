/**
 * Module: activation/registerProviders.ts
 *
 * Registers all language providers for markdown files:
 * - Semantic tokens (annotation highlighting)
 * - Hover providers (errors and skill info)
 * - Completion provider (autocomplete)
 * - CodeLens provider (play button for .brainy.md files)
 */

import * as vscode from 'vscode';
import {
    AnnotationHighlightProvider,
    AnnotationErrorHoverProvider,
    createLegend
} from '../markdown/annotationHighlightProvider';
import { SkillHoverProvider } from '../markdown/skillHoverProvider';
import { BrainyCompletionProvider } from '../markdown/completionProvider';
import { PlaybookCodeLensProvider } from '../markdown/playButton';

export interface ProvidersResult {
    playbookProvider: PlaybookCodeLensProvider;
}

/**
 * Registers all language providers for markdown files.
 * 
 * @param context - The extension context
 * @returns The playbook provider for use in command registration
 */
export function registerProviders(context: vscode.ExtensionContext): ProvidersResult {
    const legend = createLegend();
    const highlightProvider = new AnnotationHighlightProvider();
    const errorHoverProvider = new AnnotationErrorHoverProvider();
    const skillHoverProvider = new SkillHoverProvider();

    // Semantic tokens for annotation highlighting
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'markdown' },
            highlightProvider,
            legend
        )
    );

    // Hover providers (error hover takes precedence, then skill info)
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { language: 'markdown' },
            errorHoverProvider
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { language: 'markdown' },
            skillHoverProvider
        )
    );

    // Completion provider for autocomplete
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'markdown' },
            new BrainyCompletionProvider(),
            '@', '-', '"' // Trigger characters
        )
    );

    // CodeLens provider for .brainy.md files
    const playbookProvider = new PlaybookCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { language: 'markdown', pattern: '**/*.brainy.md' },
            playbookProvider
        )
    );

    // Force CodeLens refresh when files are opened
    const onDidOpen = (vscode.workspace as any).onDidOpenTextDocument;
    if (typeof onDidOpen === 'function') {
        context.subscriptions.push(
            onDidOpen((document: any) => {
                if (document?.fileName && document.fileName.endsWith('.brainy.md')) {
                    playbookProvider.refresh();
                }
            })
        );
    }

    console.log('✓ Language providers registered for markdown files');

    return { playbookProvider };
}
