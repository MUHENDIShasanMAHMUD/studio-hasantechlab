import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { createApp } from './app.js'
import { createDatabase } from './db.js'

test('health reports SQLite probe and WAL state', async () => {
  const filename = path.join(os.tmpdir(), `techlab-health-${Date.now()}.sqlite`)
  const db = createDatabase(filename)
  try {
    const response = await request(createApp(db)).get('/api/health')
    assert.equal(response.status, 200)
    assert.equal(response.body.status, 'ok')
    assert.equal(response.body.database.ok, true)
    assert.equal(response.body.database.walMode, 'wal')
  } finally {
    db.close()
    for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(filename + suffix)) fs.rmSync(filename + suffix)
  }
})
