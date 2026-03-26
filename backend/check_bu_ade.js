const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vicitrgeokvcexinwnbf.supabase.co';
const supabaseKey = 'sb_publishable_GCdmd8r06I54BjAKimuNQw_l8GPM1F9';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuAde() {
  console.log('Searching for Bu Ade in transactions...');
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .or('customer_name.ilike.%Ade%,receipt_no.eq.DN260300002');

  if (txError) {
    console.error('Error fetching transactions:', txError);
  } else {
    console.log('Transactions found:', JSON.stringify(txs, null, 2));
  }

  console.log('\nSearching for Bu Ade in customers...');
  const { data: custs, error: custError } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', '%Ade%');

  if (custError) {
    console.error('Error fetching customers:', custError);
  } else {
    console.log('Customers found:', JSON.stringify(custs, null, 2));
  }
}

checkBuAde();
