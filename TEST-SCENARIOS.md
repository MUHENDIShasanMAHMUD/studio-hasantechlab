# User Story Execution Scenarios

## New visitor
1. Open `/` in a fresh browser profile.
2. Assert `localStorage.techlab_device_token` is a UUIDv4.
3. Assert `POST /api/user/init` returns `201` with `X-Device-Token`.

## Save and share
1. Adjust a tool input and click `SAVE & SHARE`.
2. Assert `POST /api/snapshots` returns a 7-character slug.
3. Assert the toast displays the URL and the URL is passed to the Clipboard API.

## Foreign read-only visitor
1. Open `/s/{slug}` with another browser profile.
2. Assert the API response has `isOwner: false`.
3. Assert save is disabled and a `PUT` returns `403`.
4. Forking can be implemented by POSTing the loaded config as a new snapshot.

## Owner update
1. Reopen `/s/{slug}` with the original profile.
2. Assert `isOwner: true`, adjust an input, and save.
3. Assert `PUT /api/snapshots/{slug}` returns `200` and `updated_at` changes.

## SQLite concurrency
1. Run `npm run test:api`.
2. The integration test sends 50 simultaneous POST requests.
3. Assert every response is `201`; WAL is enabled for file-backed deployments via `PRAGMA journal_mode=WAL`.
