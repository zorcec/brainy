/**
 * Documents Route
 * 
 * POST /documents - Index documents into knowledge base
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { isConfigured } from '../db/index.js';
import { upsertDocument } from '../db/knowledge.js';
import { IndexRequestSchema } from '../schemas.js';

export function registerDocumentsRoute(app: FastifyInstance) {
  app.post('/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isConfigured()) {
      reply.status(400);
      return { error: 'Server not configured. Call /configure first.' };
    }

    const result = IndexRequestSchema.safeParse(request.body);

    if (!result.success) {
      reply.status(400).send({ error: 'Invalid payload', details: result.error.issues });
      return;
    }

    const body = result.data;
    const results = [];
    
    for (const doc of body.documents) {
      const result = upsertDocument(doc.fileName, doc.docType, doc.content);
      results.push({ fileName: doc.fileName, result });
    }

    return { status: 'success', results };
  });
}
