import { serve } from '@hono/node-server'
import app from './api/backend_app'

const port = 8787
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
