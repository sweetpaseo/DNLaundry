import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getSupabase } from './supabase'
import { hashPassword, verifyPassword } from './crypto'
import { env } from 'hono/adapter'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  API_SECRET_KEY: string
  VITE_API_SECRET_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

// Security Middleware: X-API-KEY Protection
app.use('/api/*', async (c, next) => {
  const apiKey = c.req.header('X-API-KEY')
  const allEnv = env(c)
  const secretKey = allEnv.API_SECRET_KEY || allEnv.VITE_API_SECRET_KEY || (typeof process !== 'undefined' ? (process.env.API_SECRET_KEY || process.env.VITE_API_SECRET_KEY) : undefined)
  
  if (secretKey && apiKey !== secretKey) {
    return c.json({ error: 'Unauthorized: Invalid API Key' }, 401)
  }
  await next()
})

// Health Check / Landing Page
app.get('/api/health', async (c) => {
  try {
    const supabase = getSupabase(c)
    const { data, error } = await supabase.from('laundry_settings').select('id').limit(1).single()
    if (error && error.code !== 'PGRST116') {
      return c.json({ status: 'error', database: 'error', message: error.message, code: error.code }, 500)
    }
    return c.json({ status: 'ok', database: 'connected' })
  } catch (e: any) {
    return c.json({ status: 'error', database: 'exception', message: e.message }, 500)
  }
})

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
// Helper: Generate Receipt Number (DN + YYMM + 5-digit sequence)
const generateReceiptNo = async (supabase: any) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `DN${year}${month}`;

  // Find the highest sequence for the current month
  const { data, error } = await supabase
    .from('transactions')
    .select('receipt_no')
    .like('receipt_no', `${prefix}%`)
    .order('receipt_no', { ascending: false })
    .limit(1);

  let sequence = 1;
  if (!error && data && data.length > 0 && data[0].receipt_no) {
    const lastSeq = parseInt(data[0].receipt_no.slice(-5));
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
};

transactions.get('/', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('transactions').select('*, customer:customers(phone, customer_id)').order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

transactions.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  
  // Custom Receipt No Logic
  let receiptNo = body.receipt_no;
  
  if (!receiptNo) {
    if (body.group_id) {
      // Check if group already has a receipt_no
      const { data: existing } = await supabase
        .from('transactions')
        .select('receipt_no')
        .eq('group_id', body.group_id)
        .not('receipt_no', 'is', null)
        .limit(1);
      
      if (existing && existing.length > 0) {
        receiptNo = existing[0].receipt_no;
      }
    }
    
    // If still no receipt_no, generate new
    if (!receiptNo) {
      receiptNo = await generateReceiptNo(supabase);
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...body, receipt_no: receiptNo })
    .select()
    
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

transactions.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('transactions').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

transactions.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Customers
const customers = new Hono<{ Bindings: Bindings }>()
customers.get('/', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('customers').select('*, member_type:customer_types!type_id(*)').order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

customers.post('/', async (c) => {
  const supabase = getSupabase(c)
  const body = await c.req.json()
  const { data, error } = await supabase.from('customers').insert(body).select('*, member_type:customer_types!type_id(*)')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

customers.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('customers').update(body).eq('id', id).select('*, member_type:customer_types!type_id(*)')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

customers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Membership (Customer Types)
const customerTypes = new Hono<{ Bindings: Bindings }>()
customerTypes.get('/', async (c) => {
  const supabase = getSupabase(c)
  
  // Auto-seed essential types if they don't exist
  const { data: existing } = await supabase.from('customer_types').select('name')
  const essential = ['Normal', 'Member', 'Reseller']
  const existingNames = (existing || []).map((e: any) => e.name.toLowerCase())
  
  for (const name of essential) {
    if (!existingNames.includes(name.toLowerCase())) {
      await supabase.from('customer_types').insert({ name })
    }
  }

  const { data, error } = await supabase.from('customer_types').select('*').order('name', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

customerTypes.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('customer_types').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

customerTypes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('customer_types').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

customerTypes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('customer_types').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Services
const services = new Hono<{ Bindings: Bindings }>()
services.get('/', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

services.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('services').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

services.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('services').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

services.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Employees
const employees = new Hono<{ Bindings: Bindings }>()
employees.get('/', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('employees').select('*').order('name', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

employees.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('employees').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

employees.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('employees').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

employees.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Incentives
const incentives = new Hono<{ Bindings: Bindings }>()
incentives.get('/', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('employee_incentives').select('*').order('date', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

incentives.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('employee_incentives').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

incentives.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('employee_incentives').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Expense Categories
const expenseCategories = new Hono<{ Bindings: Bindings }>()
expenseCategories.get('/', async (c) => {
  const supabase = getSupabase(c)
  const query = supabase.from('expense_categories').select('*').order('name', { ascending: true })
  const cashType = c.req.query('cash_type')
  if (cashType) query.eq('cash_type', cashType)
  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})
expenseCategories.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('expense_categories').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})
expenseCategories.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('expense_categories').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})
expenseCategories.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('expense_categories').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Expenses
const expenses = new Hono<{ Bindings: Bindings }>()
expenses.get('/', async (c) => {
  const supabase = getSupabase(c)
  
  // 1. Fetch expenses (raw)
  const query = supabase
    .from('laundry_expenses')
    .select('*')
    .order('date', { ascending: false })
    
  const cashType = c.req.query('cash_type')
  if (cashType) {
    query.eq('cash_type', cashType)
  }

  const { data: expensesData, error: expError } = await query
  if (expError) return c.json({ error: expError.message }, 500)
  
  // 2. Fetch categories
  const { data: categoriesData } = await supabase.from('expense_categories').select('*')
  
  // 3. Join in memory (matching the frontend requirement of 'expense_categories' as an array or object)
  const joined = (expensesData || []).map(ex => ({
    ...ex,
    expense_category: categoriesData?.find(c => c.id === ex.category_id) || null,
    // Add compatibility array if frontend expects it
    expense_categories: categoriesData?.filter(c => c.id === ex.category_id) || []
  }))

  return c.json(joined)
})

expenses.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  
  // Pick only valid columns to avoid Supabase errors
  const insertData = {
    amount: body.amount,
    category_id: body.category_id,
    description: body.description,
    date: body.date,
    cash_type: body.cash_type
  };

  const { data, error } = await supabase.from('laundry_expenses').insert(insertData).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

expenses.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)

  // Pick only valid columns to avoid Supabase errors
  const updateData: any = {};
  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.category_id !== undefined) updateData.category_id = body.category_id;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.date !== undefined) updateData.date = body.date;
  if (body.cash_type !== undefined) updateData.cash_type = body.cash_type;

  const { data, error } = await supabase.from('laundry_expenses').update(updateData).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

expenses.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('laundry_expenses').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Auth
const auth = new Hono<{ Bindings: Bindings }>()
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  const supabase = getSupabase(c)
  
  // Seed first owner if no users exist
  const { count, error: countErr } = await supabase.from('laundry_users').select('*', { count: 'exact', head: true })
  if (!countErr && count === 0) {
    const hashed = await hashPassword('admin123')
    await supabase.from('laundry_users').insert({ username: 'admin', password: hashed, name: 'Original Owner', role: 'owner' })
  }

  const { data, error } = await supabase.from('laundry_users').select('id, username, name, role, password').ilike('username', username).single()

  if (error || !data) return c.json({ error: 'Username atau password salah' }, 401)

  const hashedInput = await hashPassword(password)
  const isMatch = data.password === hashedInput || data.password === password; // Support migration from plain text

  if (!isMatch) return c.json({ error: 'Username atau password salah' }, 401)
  
  if (data.password === password) { // Auto-migrate to hash
    const newHash = await hashPassword(password)
    await supabase.from('laundry_users').update({ password: newHash }).eq('id', data.id)
  }

  const { password: _, ...user } = data
  return c.json(user)
})

// Users
const users = new Hono<{ Bindings: Bindings }>()
users.get('/', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('laundry_users').select('id, username, name, role').order('name')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})
users.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  if (body.password) body.password = await hashPassword(body.password)
  const { data, error } = await supabase.from('laundry_users').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

// Settings
const settings = new Hono<{ Bindings: Bindings }>()
settings.get('/', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('laundry_settings').select('*').single()
  if (error && error.code !== 'PGRST116') return c.json({ error: error.message }, 500)
  return c.json(data || {})
})
settings.put('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { id, ...dataToSave } = body
  const { data: existing } = await supabase.from('laundry_settings').select('id').single()
  let result;
  if (existing) result = await supabase.from('laundry_settings').update(dataToSave).eq('id', existing.id).select()
  else result = await supabase.from('laundry_settings').insert(dataToSave).select()
  if (result.error) return c.json({ error: result.error.message }, 500)
  return c.json(result.data?.[0] || dataToSave)
})

// Stock Management
const stock = new Hono<{ Bindings: Bindings }>()
stock.get('/', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('laundry_stock').select('*').order('name')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

stock.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('laundry_stock').insert(body).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0], 201)
})

stock.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('laundry_stock').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

stock.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  const { error } = await supabase.from('laundry_stock').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// Stock Logs (Movements)
const stockLogs = new Hono<{ Bindings: Bindings }>()
stockLogs.get('/', async (c) => {
  const supabase = getSupabase(c)
  const stockId = c.req.query('stock_id')
  let query = supabase.from('laundry_stock_logs').select('*, stock:laundry_stock(name, unit)').order('created_at', { ascending: false })
  if (stockId) query = query.eq('stock_id', stockId)
  
  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

stockLogs.post('/', async (c) => {
  const body = await c.req.json() // { stock_id, type, amount, note, user_id }
  const supabase = getSupabase(c)
  
  // 1. Insert Log
  const { data: logData, error: logError } = await supabase.from('laundry_stock_logs').insert(body).select()
  if (logError) return c.json({ error: logError.message }, 500)

  // 2. Update current_stock in laundry_stock
  // We need to fetch current stock first OR use a smart update
  const { data: currentStockData } = await supabase.from('laundry_stock').select('current_stock').eq('id', body.stock_id).single()
  
  if (currentStockData) {
    const newStock = body.type === 'in' 
      ? (currentStockData.current_stock + body.amount) 
      : (currentStockData.current_stock - body.amount);
      
    await supabase.from('laundry_stock').update({ current_stock: newStock }).eq('id', body.stock_id)
  }

  return c.json(logData[0], 201)
})

app.route('/api/stock', stock)
app.route('/api/stock-logs', stockLogs)
app.route('/api/customers', customers)
app.route('/api/membership', customerTypes)
app.route('/api/services', services)
app.route('/api/employees', employees)
app.route('/api/incentives', incentives)
app.route('/api/expense-categories', expenseCategories)
app.route('/api/expenses', expenses)
app.route('/api/auth', auth)
app.route('/api/users', users)
app.route('/api/settings', settings)

export default app
