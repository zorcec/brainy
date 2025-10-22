/**
 * Brainy Server - Hello World Example
 * 
 * This is a simple server setup demonstrating the basic structure.
 * SQLite with vector search will be integrated in future iterations.
 */

import Database from 'better-sqlite3';

// Simple hello world server
export function helloWorld(): string {
  return 'Hello from Brainy Server!';
}

// Initialize SQLite database (placeholder for vector search integration)
export function initDatabase(): Database.Database {
  const db = new Database(':memory:');
  
  // Create a simple table for demonstration
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return db;
}

// Main entry point when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(helloWorld());
  
  const db = initDatabase();
  console.log('Database initialized successfully');
  
  // Insert sample data
  const insert = db.prepare('INSERT INTO knowledge (content) VALUES (?)');
  insert.run('Sample knowledge base entry');
  
  // Query sample data
  const rows = db.prepare('SELECT * FROM knowledge').all();
  console.log('Sample data:', rows);
  
  db.close();
}
