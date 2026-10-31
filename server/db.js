import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export function createDatabase(filename = process.env.DB_FILE || './data/techlab.sqlite') {
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  const db = new Database(filename)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      alias_name TEXT DEFAULT 'Anonymous TechLab User',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tool_type TEXT NOT NULL,
      title TEXT NOT NULL,
      config_json TEXT NOT NULL,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_viewed_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_user_updated ON snapshots(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_snapshots_last_viewed ON snapshots(last_viewed_at);
  `)
  try { db.exec('ALTER TABLE snapshots ADD COLUMN last_viewed_at DATETIME') } catch (error) {
    if (!String(error.message).includes('duplicate column name')) throw error
  }
  return db
}

export function ensureUser(db, deviceToken, aliasName) {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(deviceToken)
  if (!existing) db.prepare('INSERT INTO users (id, alias_name) VALUES (?, ?)').run(deviceToken, aliasName || 'Anonymous TechLab User')
  return db.prepare('SELECT * FROM users WHERE id = ?').get(deviceToken)
}

export function createSlug(db) {
  let slug
  do { slug = randomUUID().replaceAll('-', '').slice(0, 7) } while (db.prepare('SELECT 1 FROM snapshots WHERE id = ?').get(slug))
  return slug
}

export function cleanupSnapshots(db, retentionDays = Number(process.env.DATA_RETENTION_DAYS || 60)) {
  if (!Number.isInteger(retentionDays) || retentionDays < 1) throw new Error('DATA_RETENTION_DAYS must be a positive integer')
  const result = db.prepare(`
    DELETE FROM snapshots
    WHERE COALESCE(last_viewed_at, updated_at, created_at) < datetime('now', ?)
  `).run(`-${retentionDays} days`)
  const orphanedUsers = db.prepare(`
    DELETE FROM users
    WHERE NOT EXISTS (SELECT 1 FROM snapshots WHERE snapshots.user_id = users.id)
      AND created_at < datetime('now', ?)
  `).run(`-${retentionDays} days`)
  return { snapshotsDeleted: result.changes, usersDeleted: orphanedUsers.changes }
}
