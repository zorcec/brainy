/**
 * Configure Route
 * 
 * POST /configure - Configure server with workspace path
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import path from 'path';
import { configure } from '../db/index.js';
import { ConfigureRequestSchema } from '../schemas.js';

export function registerConfigureRoute(app: FastifyInstance) {
  app.post('/configure', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = ConfigureRequestSchema.safeParse(request.body);

    if (!result.success) {
      reply.status(400).send({ error: 'Invalid payload', details: result.error.issues });
      return;
    }

    const { workspacePath: wsPath } = result.data;
    const brainyPath = path.join(wsPath, '.brainy');
    
    try {
      configure(brainyPath);
      return { 
        status: 'success',
        message: 'Configuration successful',
        brainyPath
      };
    } catch (error) {
      reply.status(500);
      return { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Configuration failed'
      };
    }
  });
}
