/**
 * Brainy Server
 * 
 * REST API server for Brainy knowledge assistant with SQLite storage.
 */

import { z } from 'zod';
import fastify from 'fastify';
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Global state
let globalDb: Database.Database | undefined;
let workspacePath: string | undefined;

// Zod schemas
const ConfigureRequestSchema = z.object({
  workspacePath: z.string(),
});

const DocumentSchema = z.object({
  fileName: z.string(),
  content: z.string(),
  docType: z.enum(['document', 'instruction']),
});

const IndexRequestSchema = z.object({
  type: z.literal('local'),
  documents: z.array(DocumentSchema),
});

// Configuration functions
export function configure(brainyFolderPath: string): void {
  if (globalDb) {
    globalDb.close();
  }
  
  workspacePath = brainyFolderPath;
  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }
  const dbPath = path.join(workspacePath, 'data.db');
  globalDb = new Database(dbPath);
  
  // Create knowledge table with FTS5 support
  globalDb.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
      file_name,
      content,
      content=knowledge,
      content_rowid=id
    );
    
    CREATE TRIGGER IF NOT EXISTS knowledge_ai AFTER INSERT ON knowledge BEGIN
      INSERT INTO knowledge_fts(rowid, file_name, content)
      VALUES (new.id, new.file_name, new.content);
    END;
    
    CREATE TRIGGER IF NOT EXISTS knowledge_ad AFTER DELETE ON knowledge BEGIN
      INSERT INTO knowledge_fts(knowledge_fts, rowid, file_name, content)
      VALUES ('delete', old.id, old.file_name, old.content);
    END;
    
    CREATE TRIGGER IF NOT EXISTS knowledge_au AFTER UPDATE ON knowledge BEGIN
      INSERT INTO knowledge_fts(knowledge_fts, rowid, file_name, content)
      VALUES ('delete', old.id, old.file_name, old.content);
      INSERT INTO knowledge_fts(rowid, file_name, content)
      VALUES (new.id, new.file_name, new.content);
    END;
  `);
}

export function getDatabase(): Database.Database | undefined {
  return globalDb;
}

export function isConfigured(): boolean {
  return globalDb !== undefined && workspacePath !== undefined;
}

export function resetConfiguration(): void {
  if (globalDb) {
    globalDb.close();
    globalDb = undefined;
  }
  workspacePath = undefined;
}

// Document operations
export function upsertDocument(fileName: string, docType: string, content: string): string {
  if (!globalDb) {
    throw new Error('Database not configured');
  }
  
  const existing = globalDb.prepare('SELECT id FROM knowledge WHERE file_name = ?').get(fileName) as { id: number } | undefined;
  
  if (existing) {
    globalDb.prepare('UPDATE knowledge SET content = ?, doc_type = ? WHERE id = ?').run(content, docType, existing.id);
    return 'updated';
  } else {
    globalDb.prepare('INSERT INTO knowledge (file_name, doc_type, content) VALUES (?, ?, ?)').run(fileName, docType, content);
    return 'inserted';
  }
}

// REST API routes
export function registerRoutes(app: FastifyInstance) {
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return { 
      status: 'ok',
      configured: isConfigured(),
      workspacePath: workspacePath || null
    };
  });

  app.post('/configure', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = ConfigureRequestSchema.safeParse(request.body);

    if (!result.success) {
      return sendZodError(reply, result.error);
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

  app.post('/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isConfigured()) {
      reply.status(400);
      return { error: 'Server not configured. Call /configure first.' };
    }

    const result = IndexRequestSchema.safeParse(request.body);

    if (!result.success) {
      return sendZodError(reply, result.error);
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

function sendZodError(reply: FastifyReply, error: z.ZodError) {
  reply.status(400).send({ error: 'Invalid payload', details: error.issues });
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
