// Fetches team logos from the College Football Data API
// (https://api.collegefootballdata.com) and writes them to a static
// JSON file consumed by the app. Logos change rarely, so they're baked
// in at build time. Schedules and scores are fetched live instead (see
// api/schedules.js), since they change throughout the season.
//
// Run with:
//   node --env-file=.env scripts/fetch-static-data.mjs

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { fetchTeamLogos } from '../lib/cfbd.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '..', 'src', 'data')

const YEAR = 2026
const API_KEY = process.env.CFBD_API_KEY

if (!API_KEY) {
  console.error(
    'Missing CFBD_API_KEY. Run with: node --env-file=.env scripts/fetch-static-data.mjs',
  )
  process.exit(1)
}

const logos = await fetchTeamLogos(API_KEY, YEAR)

writeFileSync(
  path.join(dataDir, 'team-logos.json'),
  JSON.stringify(logos, null, 2) + '\n',
)

console.log(`Wrote logos for ${Object.keys(logos).length} teams.`)
