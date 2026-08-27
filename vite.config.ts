import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fetchTeamRecords } from './lib/cfbd.mjs'

const YEAR = 2026

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        // Mirrors api/records.js locally so `npm run dev` behaves the
        // same as the deployed Vercel serverless function.
        name: 'cfbd-records-dev-endpoint',
        configureServer(server) {
          server.middlewares.use('/api/records', async (_req, res) => {
            const apiKey = env.CFBD_API_KEY
            if (!apiKey) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Missing CFBD_API_KEY in .env' }))
              return
            }
            try {
              const records = await fetchTeamRecords(apiKey, YEAR)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(records))
            } catch (err) {
              res.statusCode = 502
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : String(err),
                }),
              )
            }
          })
        },
      },
    ],
  }
})
