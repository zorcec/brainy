/**
 * Brainy Server
 * 
 * REST API server for Brainy knowledge assistant with SQLite storage.
 */

import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { registerRootRoute } from './routes/root.js';
import { registerConfigureRoute } from './routes/configure.js';
import { registerDocumentsRoute } from './routes/documents.js';

export { configure, getDatabase, isConfigured, resetConfiguration } from './db/index.js';
export { upsertDocument } from './db/knowledge.js';

export function registerRoutes(app: FastifyInstance) {
  registerRootRoute(app);
  registerConfigureRoute(app);
  registerDocumentsRoute(app);
}

// Main entry point when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = fastify({ logger: true });
  registerRoutes(app);
  
  const start = async () => {
    try {
      await app.listen({ port: 3000, host: '0.0.0.0' });
      console.log('Brainy Server running on http://localhost:3000');
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  
  start();
}
