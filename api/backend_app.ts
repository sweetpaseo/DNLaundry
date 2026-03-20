import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getSupabase } from './supabase'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

// Health Check / Landing Page
app.get('/api/health', async (c) => {
  try {
    const supabase = getSupabase(c.env || {})
    const { data, error } = await supabase.from('laundry_settings').select('id').limit(1).single()
    if (error && error.code !== 'PGRST116') {
      return c.json({ status: 'error', database: 'error', message: error.message, code: error.code }, 500)
    }
    return c.json({ status: 'ok', database: 'connected' })
  } catch (e: any) {
    return c.json({ status: 'error', database: 'exception', message: e.message }, 500)
  }
})

// ... (Rest of the routes)
// Note: I will use the exact same logic as backend/src/index.ts but as a single app.

app.get('/api', (c) => {
  return c.html(`
    <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: white;">
      <h1 style="color: #818cf8;">🚀 Antigravity Laundry API (Vercel)</h1>
      <p>Backend is <b>Running Successfully</b>.</p>
    </body>
  `)
})

// Transactions
const transactions = new Hono<{ Bindings: Bindings }>()
transactions.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('transactions').select('*')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})
transactions.post('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const body = await c.req.json()
  const { data, error } = await supabase.from('transactions').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

// Customers
const customers = new Hono<{ Bindings: Bindings }>()
customers.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})
customers.post('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const body = await c.req.json()
  const { data, error } = await supabase.from('customers').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})
customers.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('customers').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})
customers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env || {})
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Membership
const customerTypes = new Hono<{ Bindings: Bindings }>()
customerTypes.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('customer_types').select('*').order('discount_percent', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})
customerTypes.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('customer_types').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})
customerTypes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('customer_types').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})
customerTypes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env || {})
  const { error } = await supabase.from('customer_types').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Services
const services = new Hono<{ Bindings: Bindings }>()
services.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})
services.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('services').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})
services.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('services').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})
services.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env || {})
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Employees
const employees = new Hono<{ Bindings: Bindings }>()
employees.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('employees').select('*').order('name', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})
employees.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('employees').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})
employees.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('employees').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})
employees.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env || {})
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Incentives
const incentives = new Hono<{ Bindings: Bindings }>()
incentives.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('employee_incentives').select('*').order('date', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})
incentives.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('employee_incentives').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})
incentives.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env || {})
  const { error } = await supabase.from('employee_incentives').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Expenses
const expenses = new Hono<{ Bindings: Bindings }>()
expenses.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('laundry_expenses').select('*').order('date', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})
expenses.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('laundry_expenses').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})
expenses.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('laundry_expenses').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})
expenses.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env || {})
  const { error } = await supabase.from('laundry_expenses').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Auth
const auth = new Hono<{ Bindings: Bindings }>()
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  const supabase = getSupabase(c.env || {})
  
  const { data, error } = await supabase
    .from('laundry_users')
    .select('id, username, name, role, password')
    .eq('username', username)
    .single()

  if (error || !data || data.password !== password) {
    return c.json({ error: 'Username atau password salah' }, 401)
  }

  const { password: _, ...user } = data
  return c.json(user)
})

// Users
const users = new Hono<{ Bindings: Bindings }>()
users.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('laundry_users').select('id, username, name, role').order('name')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})
users.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('laundry_users').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

// Settings
const settings = new Hono<{ Bindings: Bindings }>()
settings.get('/', async (c) => {
  const supabase = getSupabase(c.env || {})
  const { data, error } = await supabase.from('laundry_settings').select('*').single()
  if (error && error.code !== 'PGRST116') return c.json({ error: error.message }, 500)
  return c.json(data || {})
})
settings.put('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env || {})
  const { id, ...dataToSave } = body
  const { data: existing } = await supabase.from('laundry_settings').select('id').single()
  let result;
  if (existing) result = await supabase.from('laundry_settings').update(dataToSave).eq('id', existing.id).select()
  else result = await supabase.from('laundry_settings').insert(dataToSave).select()
  if (result.error) return c.json({ error: result.error.message }, 500)
  return c.json(result.data?.[0] || dataToSave)
})

app.route('/api/transactions', transactions)
app.route('/api/customers', customers)
app.route('/api/membership', customerTypes)
app.route('/api/services', services)
app.route('/api/employees', employees)
app.route('/api/incentives', incentives)
app.route('/api/expenses', expenses)
app.route('/api/auth', auth)
app.route('/api/users', users)
app.route('/api/settings', settings)

export default app
