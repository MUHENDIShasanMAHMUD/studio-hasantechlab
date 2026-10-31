import { createApp } from './app.js'
import { createDatabase, cleanupSnapshots } from './db.js'

const port = process.env.PORT || 3000
const db = createDatabase()
const app = createApp(db)
const cleanupHours = Number(process.env.CLEANUP_INTERVAL_HOURS || 24)
if (process.env.DISABLE_CLEANUP !== 'true') {
	setInterval(() => {
		try { console.log('Snapshot cleanup:', cleanupSnapshots(db)) } catch (error) { console.error('Snapshot cleanup failed:', error) }
	}, cleanupHours * 60 * 60 * 1000).unref()
}
app.listen(port, () => console.log(`TechLab API listening on http://localhost:${port}`))
