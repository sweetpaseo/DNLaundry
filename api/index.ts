import { handle } from 'hono/vercel'
import app from './backend/src/index'

export const config = {
  runtime: 'edge'
}

export default handle(app)
