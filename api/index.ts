import { handle } from 'hono/vercel'
import app from './backend_app'

export const config = {
  runtime: 'edge'
}

export default handle(app)
