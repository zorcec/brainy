/**
 * Knowledge Operations Module
 * 
 * Document CRUD operations for the knowledge base.
 */

import { getDatabase } from './index.js';

export function upsertDocument(fileName: string, docType: string, content: string): string {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not configured');
  }
  
  const existing = db.prepare('SELECT id FROM knowledge WHERE file_name = ?').get(fileName) as { id: number } | undefined;
  
  if (existing) {
    db.prepare('UPDATE knowledge SET content = ?, doc_type = ? WHERE id = ?').run(content, docType, existing.id);
    return 'updated';
  } else {
    db.prepare('INSERT INTO knowledge (file_name, doc_type, content) VALUES (?, ?, ?)').run(fileName, docType, content);
    return 'inserted';
  }
}
