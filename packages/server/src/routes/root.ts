/**
 * Root Route
 * 
 * GET / - Server status endpoint
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { isConfigured, getWorkspacePath } from '../db/index.js';

export function registerRootRoute(app: FastifyInstance) {
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return { 
      status: 'ok',
      configured: isConfigured(),
      workspacePath: getWorkspacePath() || null
    };
  });
}
