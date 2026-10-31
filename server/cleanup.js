import { createDatabase, cleanupSnapshots } from './db.js'

const db = createDatabase()
try {
  console.log(JSON.stringify(cleanupSnapshots(db)))
} finally {
  db.close()
}
