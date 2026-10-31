# Production deployment

1. Copy `.env.example` to `.env` and set `CORS_ORIGINS=https://tools.hasantechlab.com`.
2. Point DNS for `tools.hasantechlab.com` to the host running Docker.
3. Run `docker compose up -d --build`.
4. Put TLS termination in front of port 80 using your existing Nginx/Caddy/load balancer and redirect HTTP to HTTPS.
5. Back up the named volume `techlab-engineering-data`; SQLite WAL files must be backed up with the database using a SQLite-aware backup or after a controlled checkpoint.

The API health endpoint is `GET /api/health`. It runs `SELECT 1` and verifies `journal_mode=wal`; Docker marks the API unhealthy with a non-zero healthcheck when either condition fails.

The web container proxies `/api` internally to the API container, so browser requests remain same-origin. `TRUST_PROXY=true` is required only when the API is behind a trusted reverse proxy so Express can identify client IPs for rate limiting.

Retention runs every 24 hours in the API process. For a separate scheduler, run `docker compose exec api node server/cleanup.js` from cron instead and set `DISABLE_CLEANUP=true`.
