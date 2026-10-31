import test from 'node:test'
import assert from 'node:assert/strict'
import { createDatabase, cleanupSnapshots } from './db.js'

test('cleanup removes stale snapshots and orphaned users but keeps active snapshots', () => {
  const db = createDatabase(':memory:')
  db.prepare('INSERT INTO users (id) VALUES (?)').run('old-user')
  db.prepare('INSERT INTO users (id) VALUES (?)').run('active-user')
  db.prepare("UPDATE users SET created_at = datetime('now', '-90 days') WHERE id = 'old-user'").run()
  db.prepare("INSERT INTO snapshots (id, user_id, tool_type, title, config_json, updated_at, last_viewed_at) VALUES (?, ?, ?, ?, ?, datetime('now', '-90 days'), datetime('now', '-90 days'))").run('old', 'old-user', 'pwm_calc', 'Old', '{}')
  db.prepare("INSERT INTO snapshots (id, user_id, tool_type, title, config_json, updated_at, last_viewed_at) VALUES (?, ?, ?, ?, ?, datetime('now', '-90 days'), datetime('now'))").run('active', 'active-user', 'pwm_calc', 'Active', '{}')
  assert.deepEqual(cleanupSnapshots(db, 60), { snapshotsDeleted: 1, usersDeleted: 1 })
  assert.ok(db.prepare('SELECT 1 FROM snapshots WHERE id = ?').get('active'))
  assert.equal(db.prepare('SELECT 1 FROM snapshots WHERE id = ?').get('old'), undefined)
  db.close()
})