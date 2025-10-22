/**
 * Brainy Server - Tests
 * 
 * Unit tests for the hello world server functionality.
 */

import { describe, it, expect } from 'vitest';
import { helloWorld, initDatabase } from './server.js';

describe('helloWorld', () => {
  it('should return hello message', () => {
    const result = helloWorld();
    expect(result).toBe('Hello from Brainy Server!');
  });
});

describe('initDatabase', () => {
  it('should initialize database successfully', () => {
    const db = initDatabase();
    expect(db).toBeDefined();
    
    // Verify table exists
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge'"
    ).all();
    expect(tables).toHaveLength(1);
    
    db.close();
  });

  it('should allow inserting and querying data', () => {
    const db = initDatabase();
    
    // Insert test data
    const insert = db.prepare('INSERT INTO knowledge (content) VALUES (?)');
    const result = insert.run('Test knowledge');
    expect(result.changes).toBe(1);
    
    // Query data
    const rows = db.prepare('SELECT * FROM knowledge WHERE content = ?').all('Test knowledge');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveProperty('content', 'Test knowledge');
    
    db.close();
  });
});
