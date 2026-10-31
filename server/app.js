import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { createDatabase, ensureUser, createSlug } from './db.js'

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SNAPSHOT_ID_PATTERN = /^[0-9a-f]{7}$/i
const TOOL_TYPE_PATTERN = /^[a-z][a-z0-9_]{1,31}$/
const MAX_CONFIG_BYTES = 50_000

function parseAllowedOrigins() {
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',').map((origin) => origin.trim()).filter(Boolean)
  if (origins.includes('*')) throw new Error('CORS_ORIGINS must not contain wildcard origins')
  return origins
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[<>]/g, '').trim()
  return cleaned && cleaned.length <= maxLength ? cleaned : null
}

function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null
  let serialized
  try { serialized = JSON.stringify(config) } catch { return null }
  return serialized.length <= MAX_CONFIG_BYTES ? { config, serialized } : null
}

function validateSnapshotBody(body) {
  const toolType = cleanText(body?.toolType, 32)?.toLowerCase()
  const title = cleanText(body?.title, 120)
  const validatedConfig = validateConfig(body?.config)
  if (!toolType || !TOOL_TYPE_PATTERN.test(toolType) || !title || !validatedConfig) return null
  return { toolType, title, ...validatedConfig }
}

export function createApp(db = createDatabase()) {
  const app = express()
  const allowedOrigins = parseAllowedOrigins()
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false)
  app.use(helmet())
  app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'X-Device-Token']
  }))
  app.use(express.json({ limit: '100kb' }))
  app.use((req, res, next) => {
    req.deviceToken = req.header('X-Device-Token')
    next()
  })

  app.get('/api/health', (req, res) => {
    try {
      const probe = db.prepare('SELECT 1 AS ok').get()
      const journalMode = String(db.pragma('journal_mode', { simple: true })).toLowerCase()
      const databaseOk = probe?.ok === 1
      const walEnabled = journalMode === 'wal'
      const healthy = databaseOk && walEnabled
      res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        database: { ok: databaseOk, walMode: journalMode },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(503).json({ status: 'down', database: { ok: false }, error: 'Database probe failed' })
    }
  })

  const limiterKey = (req) => req.deviceToken || ipKeyGenerator(req.ip)
  app.use('/api', rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000), limit: Number(process.env.RATE_LIMIT_MAX || 100), standardHeaders: 'draft-8', legacyHeaders: false, keyGenerator: limiterKey, message: { error: 'Too many requests. Try again later.' } }))
  app.use('/api', rateLimit({ windowMs: Number(process.env.WRITE_RATE_LIMIT_WINDOW_MS || 60_000), limit: Number(process.env.WRITE_RATE_LIMIT_MAX || 60), standardHeaders: 'draft-8', legacyHeaders: false, keyGenerator: limiterKey, skip: (req) => req.method === 'GET', message: { error: 'Too many write requests. Try again later.' } }))
  app.use('/api/snapshots', rateLimit({ windowMs: Number(process.env.SNAPSHOT_WRITE_RATE_LIMIT_WINDOW_MS || 60_000), limit: Number(process.env.SNAPSHOT_WRITE_RATE_LIMIT_MAX || 60), standardHeaders: 'draft-8', legacyHeaders: false, keyGenerator: limiterKey, skip: (req) => req.method === 'GET', message: { error: 'Too many snapshot writes. Try again later.' } }))

  const requireDevice = (req, res, next) => {
    if (!req.deviceToken || !UUID_V4_PATTERN.test(req.deviceToken)) return res.status(400).json({ error: 'X-Device-Token must be a UUIDv4' })
    next()
  }

  app.post('/api/user/init', requireDevice, (req, res) => {
    const aliasName = req.body?.aliasName === undefined ? undefined : cleanText(req.body.aliasName, 80)
    if (req.body?.aliasName !== undefined && !aliasName) return res.status(422).json({ error: 'aliasName must be a non-empty string up to 80 characters' })
    res.status(201).json({ user: ensureUser(db, req.deviceToken, aliasName) })
  })

  app.post('/api/snapshots', requireDevice, (req, res) => {
    const validated = validateSnapshotBody(req.body)
    if (!validated) return res.status(422).json({ error: 'Invalid snapshot payload' })
    const { toolType, title, config, serialized } = validated
    ensureUser(db, req.deviceToken)
    const id = createSlug(db)
    db.prepare('INSERT INTO snapshots (id, user_id, tool_type, title, config_json) VALUES (?, ?, ?, ?, ?)').run(id, req.deviceToken, toolType, title, serialized)
    res.status(201).json({ id, url: `/s/${id}`, snapshot: db.prepare('SELECT * FROM snapshots WHERE id = ?').get(id) })
  })

  app.get(['/api/user/snapshots', '/api/snapshots/user/mine'], requireDevice, (req, res) => {
    const snapshots = db.prepare('SELECT id, tool_type, title, views_count, created_at, updated_at FROM snapshots WHERE user_id = ? ORDER BY updated_at DESC').all(req.deviceToken)
    res.json({ snapshots })
  })

  app.get('/api/snapshots/:id', (req, res) => {
    if (!SNAPSHOT_ID_PATTERN.test(req.params.id)) return res.status(400).json({ error: 'Invalid snapshot id' })
    const snapshot = db.prepare('SELECT * FROM snapshots WHERE id = ?').get(req.params.id)
    if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' })
    db.prepare("UPDATE snapshots SET views_count = views_count + 1, last_viewed_at = datetime('now') WHERE id = ?").run(req.params.id)
    res.json({ snapshot: { ...snapshot, config: JSON.parse(snapshot.config_json), isOwner: snapshot.user_id === req.deviceToken } })
  })

  app.put('/api/snapshots/:id', requireDevice, (req, res) => {
    if (!SNAPSHOT_ID_PATTERN.test(req.params.id)) return res.status(400).json({ error: 'Invalid snapshot id' })
    const snapshot = db.prepare('SELECT * FROM snapshots WHERE id = ?').get(req.params.id)
    if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' })
    if (snapshot.user_id !== req.deviceToken) return res.status(403).json({ error: 'Only the owner can update this snapshot' })
    const validated = validateSnapshotBody({ ...req.body, toolType: snapshot.tool_type })
    if (!validated) return res.status(422).json({ error: 'Invalid snapshot payload' })
    db.prepare("UPDATE snapshots SET title = ?, config_json = ?, updated_at = datetime('now') WHERE id = ?").run(validated.title, validated.serialized, req.params.id)
    res.json({ snapshot: db.prepare('SELECT * FROM snapshots WHERE id = ?').get(req.params.id) })
  })

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON request' })
    console.error('Unhandled API error:', err)
    res.status(500).json({ error: 'Internal server error' })
  })
  return app
}
