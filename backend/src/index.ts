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
    const supabase = getSupabase(c.env)
    const { data, error } = await supabase.from('laundry_settings').select('id').limit(1).single()
    if (error && error.code !== 'PGRST116') {
      return c.json({ status: 'error', database: 'error', message: error.message, code: error.code }, 500)
    }
    return c.json({ status: 'ok', database: 'connected' })
  } catch (e: any) {
    return c.json({ status: 'error', database: 'exception', message: e.message }, 500)
  }
})

app.get('/', (c) => {
  return c.html(`
    <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: white;">
      <h1 style="color: #818cf8;">🚀 Antigravity Laundry API</h1>
      <p>Backend is <b>Running Successfully</b> on Port 8787.</p>
      <ul>
        <li>API Status: <span style="color: #10b981;">Online</span></li>
        <li>Endpoint: <code>/api/transactions</code></li>
      </ul>
      <p style="color: #94a3b8; font-size: 0.875rem;">Note: Pastikan <code>.dev.vars</code> sudah diisi dengan Supabase URL & Key agar API berfungsi.</p>
    </body>
  `)
})

// Transactions API
const transactions = new Hono<{ Bindings: Bindings }>()

transactions.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('transactions').select('*')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

transactions.post('/', async (c) => {
  const supabase = getSupabase(c.env)
  const body = await c.req.json()
  const { data, error } = await supabase.from('transactions').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

// Customers API
const customers = new Hono<{ Bindings: Bindings }>()
customers.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

customers.post('/', async (c) => {
  const supabase = getSupabase(c.env)
  const body = await c.req.json()
  const { data, error } = await supabase.from('customers').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

customers.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('customers').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

customers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Member Types (Jenis Member) API
const memberTypes = new Hono<{ Bindings: Bindings }>()

memberTypes.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('customer_types').select('*').order('name', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

memberTypes.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('customer_types').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

memberTypes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('customer_types').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

memberTypes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  const { error } = await supabase.from('customer_types').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Services API
const services = new Hono<{ Bindings: Bindings }>()

services.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [
    { id: '1', name: 'Cuci Kering', price: 6000, unit: 'kg', is_active: true },
    { id: '2', name: 'Setrika', price: 4000, unit: 'kg', is_active: true },
    { id: '3', name: 'Express', price: 10000, unit: 'kg', is_active: true },
    { id: '4', name: 'Bedcover', price: 25000, unit: 'pcs', is_active: true }
  ])
})

services.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('services').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

services.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('services').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

services.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Employees API
const employees = new Hono<{ Bindings: Bindings }>()

employees.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('employees').select('*').order('name', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

employees.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('employees').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

employees.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('employees').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

employees.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Incentives API
const incentives = new Hono<{ Bindings: Bindings }>()

incentives.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('employee_incentives').select('*').order('date', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

incentives.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('employee_incentives').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

incentives.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  const { error } = await supabase.from('employee_incentives').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Expenses API (Petty Cash)
const expenses = new Hono<{ Bindings: Bindings }>()

expenses.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('laundry_expenses').select('*').order('date', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

expenses.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('laundry_expenses').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

expenses.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('laundry_expenses').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

expenses.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  const { error } = await supabase.from('laundry_expenses').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Auth API
const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  const supabase = getSupabase(c.env)
  
  // Check if any users exist to auto-create first owner
  const { count, error: countErr } = await supabase
    .from('laundry_users')
    .select('*', { count: 'exact', head: true })

  if (!countErr && count === 0) {
    await supabase.from('laundry_users').insert({ 
      username: 'admin', 
      password: 'admin123', 
      name: 'Original Owner', 
      role: 'owner' 
    })
  }
  
  const { data, error } = await supabase
    .from('laundry_users')
    .select('id, username, name, role, password')
    .ilike('username', username)
    .single()

  if (error || !data || data.password !== password) {
    return c.json({ error: 'Username atau password salah' }, 401)
  }

  const { password: _, ...user } = data
  return c.json(user)
})

auth.put('/change-password', async (c) => {
  const { userId, newPassword } = await c.req.json()
  const supabase = getSupabase(c.env)
  const { error } = await supabase
    .from('laundry_users')
    .update({ password: newPassword })
    .eq('id', userId)
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Users API (Management)
const users = new Hono<{ Bindings: Bindings }>()

users.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('laundry_users').select('id, username, name, role').order('name')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

users.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('laundry_users').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

users.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  
  const updateData = { ...body }
  if (!updateData.password) delete updateData.password

  const { data, error } = await supabase.from('laundry_users').update(updateData).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

users.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  const { error } = await supabase.from('laundry_users').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Settings API
const settings = new Hono<{ Bindings: Bindings }>()

settings.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase.from('laundry_settings').select('*').single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    return c.json({ error: error.message }, 500)
  }
  
  return c.json(data || {
    name: 'Antigravity Laundry',
    phone: '081234567890',
    address: 'Jl. Antigravity No. 123, Jakarta',
    footer_text: 'Terima kasih telah mencuci di Antigravity Laundry!',
    instagram: '@antigravity.laundry'
  })
})

settings.put('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env)
  const { id, ...dataToSave } = body
  
  // Try to find existing record
  const { data: existing } = await supabase.from('laundry_settings').select('id').single()
  
  let result;
  if (existing) {
    result = await supabase.from('laundry_settings').update(dataToSave).eq('id', existing.id).select()
  } else {
    result = await supabase.from('laundry_settings').insert(dataToSave).select()
  }
  
  if (result.error) return c.json({ error: result.error.message }, 500)
  return c.json(result.data?.[0] || dataToSave)
})

app.route('/api/transactions', transactions)
app.route('/api/customers', customers)
app.route('/api/membership', memberTypes)
app.route('/api/services', services)
app.route('/api/employees', employees)
app.route('/api/incentives', incentives)
app.route('/api/expenses', expenses)
app.route('/api/auth', auth)
app.route('/api/users', users)
app.route('/api/settings', settings)

export default app
