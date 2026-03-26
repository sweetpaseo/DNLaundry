const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vicitrgeokvcexinwnbf.supabase.co';
const supabaseKey = 'sb_publishable_GCdmd8r06I54BjAKimuNQw_l8GPM1F9';
const supabase = createClient(supabaseUrl, supabaseKey);

const TRANSACTION_ID = 'fb3558cc-6ac6-46a7-9ddc-9ca809eb0d86';
const NORMAL_TYPE_ID = 'c47219ab-8a8b-42f8-9539-453986e7e5f2';
const NEW_CUSTOMER_ID = 'DN00072';

async function fixTransaction() {
  console.log('Creating customer "Bu Ade"...');
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({
      name: 'Bu Ade',
      customer_id: NEW_CUSTOMER_ID,
      type_id: NORMAL_TYPE_ID,
      phone: '',
      address: ''
    })
    .select()
    .single();

  if (customerError) {
    console.error('Error creating customer:', customerError);
    return;
  }

  console.log('Customer created:', customer.id);

  console.log(`Linking transaction ${TRANSACTION_ID} to customer ${customer.id}...`);
  const { data: updatedTx, error: txError } = await supabase
    .from('transactions')
    .update({
      customer_id: customer.id
    })
    .eq('id', TRANSACTION_ID)
    .select();

  if (txError) {
    console.error('Error updating transaction:', txError);
  } else {
    console.log('Transaction updated successfully:', updatedTx[0].receipt_no);
  }
}

fixTransaction();
