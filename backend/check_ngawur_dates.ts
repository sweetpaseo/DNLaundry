import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vicitrgeokvcexinwnbf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GCdmd8r06I54BjAKimuNQw_l8GPM1F9';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, receipt_no, customer_name, service_name, created_at, due_date')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Checking ${transactions.length} transactions...`);
  
  transactions.forEach(t => {
    const created = new Date(t.created_at);
    const due = new Date(t.due_date || '');
    if (isNaN(due.getTime())) return;

    const diffDays = (due.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    
    // Flag if diff is absurd (> 10 days for normal laundry) or negative
    if (diffDays > 10 || diffDays < 0) {
      console.log(`[!] ID: ${t.receipt_no || t.id.slice(0,8)} | Cust: ${t.customer_name} | Srv: ${t.service_name} | Created: ${t.created_at} | Due: ${t.due_date} | Diff: ${diffDays.toFixed(1)} days`);
    }
  });
}

check();
