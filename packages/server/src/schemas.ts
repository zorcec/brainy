/**
 * Zod Schemas
 * 
 * Request validation schemas for API endpoints.
 */

import { z } from 'zod';

export const ConfigureRequestSchema = z.object({
  workspacePath: z.string(),
});

export const DocumentSchema = z.object({
  fileName: z.string(),
  content: z.string(),
  docType: z.enum(['document', 'instruction']),
});

export const IndexRequestSchema = z.object({
  type: z.literal('local'),
  documents: z.array(DocumentSchema),
});
