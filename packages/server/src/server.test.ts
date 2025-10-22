/**
 * Brainy Server - Tests
 * 
 * Unit tests for the REST API server and database operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { registerRoutes, configure, getDatabase, isConfigured, resetConfiguration, upsertDocument } from './server.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Server Configuration', () => {
  let testDir: string;

  beforeEach(() => {
    resetConfiguration();
    testDir = path.join(os.tmpdir(), `brainy-test-${Date.now()}`);
  });

  afterEach(() => {
    resetConfiguration();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create .brainy directory and initialize database', () => {
    const brainyPath = path.join(testDir, '.brainy');
    
    configure(brainyPath);
    
    expect(fs.existsSync(brainyPath)).toBe(true);
    expect(fs.existsSync(path.join(brainyPath, 'data.db'))).toBe(true);
    expect(isConfigured()).toBe(true);
  });

  it('should create knowledge table after configuration', () => {
    const brainyPath = path.join(testDir, '.brainy');
    
    configure(brainyPath);
    const db = getDatabase();
    
    expect(db).toBeDefined();
    const tables = db!.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge'"
    ).all();
    expect(tables).toHaveLength(1);
  });

  it('should create FTS5 table for full-text search', () => {
    const brainyPath = path.join(testDir, '.brainy');
    
    configure(brainyPath);
    const db = getDatabase();
    
    const tables = db!.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge_fts'"
    ).all();
    expect(tables).toHaveLength(1);
  });
});

describe('Document Operations', () => {
  let testDir: string;

  beforeEach(() => {
    resetConfiguration();
    testDir = path.join(os.tmpdir(), `brainy-test-${Date.now()}`);
    const brainyPath = path.join(testDir, '.brainy');
    configure(brainyPath);
  });

  afterEach(() => {
    resetConfiguration();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should insert a new document', () => {
    const result = upsertDocument('test.md', 'document', 'Test content');
    expect(result).toBe('inserted');
    
    const db = getDatabase();
    const rows = db!.prepare('SELECT * FROM knowledge WHERE file_name = ?').all('test.md');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveProperty('content', 'Test content');
  });

  it('should update an existing document', () => {
    upsertDocument('test.md', 'document', 'Original content');
    const result = upsertDocument('test.md', 'document', 'Updated content');
    expect(result).toBe('updated');
    
    const db = getDatabase();
    const rows = db!.prepare('SELECT * FROM knowledge WHERE file_name = ?').all('test.md');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveProperty('content', 'Updated content');
  });

  it('should throw error if database not configured', () => {
    resetConfiguration();
    expect(() => upsertDocument('test.md', 'document', 'Content')).toThrow('Database not configured');
  });
});

describe('REST API Endpoints', () => {
  let app: FastifyInstance;
  let testDir: string;

  beforeEach(async () => {
    resetConfiguration();
    testDir = path.join(os.tmpdir(), `brainy-test-${Date.now()}`);
    app = fastify();
    registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    resetConfiguration();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('GET / should return server status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.payload);
    expect(json).toHaveProperty('status', 'ok');
    expect(json).toHaveProperty('configured', false);
  });

  it('POST /configure should configure the server', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/configure',
      payload: {
        workspacePath: testDir
      }
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.payload);
    expect(json).toHaveProperty('status', 'success');
    expect(json).toHaveProperty('brainyPath');
    expect(isConfigured()).toBe(true);
  });

  it('POST /configure should return error for invalid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/configure',
      payload: {
        invalidField: 'test'
      }
    });

    expect(response.statusCode).toBe(400);
    const json = JSON.parse(response.payload);
    expect(json).toHaveProperty('error', 'Invalid payload');
  });

  it('POST /documents should return error if not configured', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/documents',
      payload: {
        type: 'local',
        documents: []
      }
    });

    expect(response.statusCode).toBe(400);
    const json = JSON.parse(response.payload);
    expect(json).toHaveProperty('error');
  });

  it('POST /documents should upsert documents after configuration', async () => {
    await app.inject({
      method: 'POST',
      url: '/configure',
      payload: { workspacePath: testDir }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/documents',
      payload: {
        type: 'local',
        documents: [
          { fileName: 'test1.md', content: 'Content 1', docType: 'document' },
          { fileName: 'test2.md', content: 'Content 2', docType: 'instruction' }
        ]
      }
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.payload);
    expect(json).toHaveProperty('status', 'success');
    expect(json.results).toHaveLength(2);
    expect(json.results[0].result).toBe('inserted');
    
    const db = getDatabase();
    const rows = db!.prepare('SELECT * FROM knowledge').all();
    expect(rows).toHaveLength(2);
  });

  it('POST /documents should return error for invalid payload', async () => {
    await app.inject({
      method: 'POST',
      url: '/configure',
      payload: { workspacePath: testDir }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/documents',
      payload: {
        type: 'local',
        documents: [
          { fileName: 'test.md', invalidField: 'test' }
        ]
      }
    });

    expect(response.statusCode).toBe(400);
    const json = JSON.parse(response.payload);
    expect(json).toHaveProperty('error', 'Invalid payload');
  });
});
