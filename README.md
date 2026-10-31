# TechLab Engineering & Hardware Sandbox

A production-minded Vue 3 + Express + SQLite sandbox for interactive mechatronics calculators and shareable snapshots.

## Run

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:3000`

## Tests

```bash
npm test
npm run build
```

The API accepts `X-Device-Token` on every identity-aware request. SQLite uses WAL mode, and snapshots are owner-protected while public links remain read-only for other devices.

## Security baseline

- Helmet security headers and a strict CORS allowlist are enabled. Production must set `CORS_ORIGINS` explicitly; wildcard origins are rejected.
- UUIDv4 device tokens, snapshot slugs, titles, tool types, and serialized config sizes are validated before database writes.
- All database values use prepared statements. Snapshot updates verify ownership against `user_id` before writing; there is no public update/delete path.
- API reads and writes have separate rate-limit budgets. Malformed JSON and unexpected server errors return safe messages while details are logged server-side.
- `.gitignore` excludes `.env`, SQLite/WAL files, logs, private keys, secrets, build output, and dependencies. Commit only `.env.example`.

## Production safeguards

- `GET /api/health` executes `SELECT 1` and verifies `PRAGMA journal_mode` is `wal`; it returns `503` when either check fails.
- Express rate limits requests by device token when present, otherwise by client IP. Limits are configurable with `RATE_LIMIT_*` and `WRITE_RATE_LIMIT_*` environment variables.
- Snapshots have indexed ownership/activity fields and are cleaned after `DATA_RETENTION_DAYS` of inactivity. Cleanup runs every 24 hours or with `npm run cleanup`.
- GitHub Actions in [.github/workflows/ci.yml](.github/workflows/ci.yml) runs `npm ci`, `npm test`, `npm run build`, and builds both Docker images on pushes and pull requests.
- Docker Compose uses a persistent named volume and waits for the API healthcheck before starting Nginx. Deployment details are in [deploy/README.md](deploy/README.md).
