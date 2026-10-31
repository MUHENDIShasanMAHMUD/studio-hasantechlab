import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { createApp } from './app.js'
import { createDatabase } from './db.js'

function setup() {
  const db = createDatabase(':memory:')
  return { db, app: createApp(db), owner: randomUUID(), stranger: randomUUID() }
}

test('initializes a device and validates UUIDs', async () => {
  const { app, owner } = setup()
  const response = await request(app).post('/api/user/init').set('X-Device-Token', owner).send({ aliasName: 'Bench User' })
  assert.equal(response.status, 201)
  assert.equal(response.body.user.alias_name, 'Bench User')
  assert.equal((await request(app).post('/api/user/init').set('X-Device-Token', 'bad').send({})).status, 400)
})

test('creates, reads, lists, and updates an owned snapshot', async () => {
  const { app, owner } = setup()
  const created = await request(app).post('/api/snapshots').set('X-Device-Token', owner).send({ toolType: 'pwm_calc', title: 'Bench PWM', config: { duty: 42 } })
  assert.equal(created.status, 201)
  const id = created.body.id
  const read = await request(app).get(`/api/snapshots/${id}`).set('X-Device-Token', owner)
  assert.equal(read.body.snapshot.isOwner, true)
  assert.deepEqual(read.body.snapshot.config, { duty: 42 })
  assert.equal((await request(app).get('/api/user/snapshots')).status, 400)
  const mine = await request(app).get('/api/user/snapshots').set('X-Device-Token', owner)
  assert.equal(mine.body.snapshots.length, 1)
  const updated = await request(app).put(`/api/snapshots/${id}`).set('X-Device-Token', owner).send({ title: 'Updated PWM', config: { duty: 80 } })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.snapshot.title, 'Updated PWM')
})

test('serves foreign readers as read-only and rejects their PUT', async () => {
  const { app, owner, stranger } = setup()
  const created = await request(app).post('/api/snapshots').set('X-Device-Token', owner).send({ toolType: 'stepper_calc', title: 'Motor', config: {} })
  const id = created.body.id
  const read = await request(app).get(`/api/snapshots/${id}`).set('X-Device-Token', stranger)
  assert.equal(read.body.snapshot.isOwner, false)
  assert.equal((await request(app).put(`/api/snapshots/${id}`).set('X-Device-Token', stranger).send({ title: 'Nope', config: {} })).status, 403)
})

test('handles 50 concurrent snapshot writes with WAL enabled', async () => {
  const filename = path.join(os.tmpdir(), `techlab-${randomUUID()}.sqlite`)
  const db = createDatabase(filename)
  const app = createApp(db)
  const owner = randomUUID()
  const results = await Promise.all(Array.from({ length: 50 }, (_, index) => request(app).post('/api/snapshots').set('X-Device-Token', owner).send({ toolType: 'pwm_calc', title: `Load ${index}`, config: { duty: index } })))
  assert.ok(results.every((result) => result.status === 201))
  assert.equal(db.pragma('journal_mode', { simple: true }), 'wal')
  db.close()
  for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(filename + suffix)) fs.rmSync(filename + suffix)
})

test('returns 429 after the configured token request budget', async () => {
  const previous = process.env.RATE_LIMIT_MAX
  process.env.RATE_LIMIT_MAX = '2'
  const { app, owner } = setup()
  try {
    assert.equal((await request(app).get('/api/snapshots/user/mine').set('X-Device-Token', owner)).status, 200)
    assert.equal((await request(app).get('/api/snapshots/user/mine').set('X-Device-Token', owner)).status, 200)
    assert.equal((await request(app).get('/api/snapshots/user/mine').set('X-Device-Token', owner)).status, 429)
  } finally {
    if (previous === undefined) delete process.env.RATE_LIMIT_MAX
    else process.env.RATE_LIMIT_MAX = previous
  }
})

test('rejects invalid UUIDs, malformed JSON, and unsafe payload shapes', async () => {
  const { app, owner } = setup()
  const invalidUuid = `${owner.slice(0, 14)}5${owner.slice(15)}`
  assert.equal((await request(app).post('/api/user/init').set('X-Device-Token', invalidUuid).send({})).status, 400)
  const malformed = await request(app).post('/api/snapshots').set('X-Device-Token', owner).set('Content-Type', 'application/json').send('{')
  assert.equal(malformed.status, 400)
  const invalid = await request(app).post('/api/snapshots').set('X-Device-Token', owner).send({ toolType: 'pwm_calc', title: 'x'.repeat(121), config: [] })
  assert.equal(invalid.status, 422)
})

test('adds security headers and rejects non-allowlisted CORS origins', async () => {
  const { app } = setup()
  const response = await request(app).get('/api/health').set('Origin', 'https://evil.example')
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
  assert.equal(response.headers['access-control-allow-origin'], undefined)
})
