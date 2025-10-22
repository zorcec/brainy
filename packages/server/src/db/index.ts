/**
 * Database Configuration Module
 * 
 * Manages SQLite database connection and initialization.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let globalDb: Database.Database | undefined;
let workspacePath: string | undefined;

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

export function getWorkspacePath(): string | undefined {
  return workspacePath;
}

export function resetConfiguration(): void {
  if (globalDb) {
    globalDb.close();
    globalDb = undefined;
  }
  workspacePath = undefined;
}
