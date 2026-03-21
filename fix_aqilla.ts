import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const backendEnvPath = 'c:/Users/Fanto/Desktop/antigravity/laundry/backend/.dev.vars';
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(backendEnvPath)) {
    const lines = fs.readFileSync(backendEnvPath, 'utf8').split('\n');
    lines.forEach(line => {
        if (line.startsWith('SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
        if (line.startsWith('SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
    });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAqilla() {
    console.log('Finding Reseller ID...');
    const { data: types } = await supabase.from('customer_types').select('*').eq('name', 'Reseller').single();
    if (!types) {
        console.error('Could not find Reseller type!');
        return;
    }
    const resellerId = types.id;
    console.log('Reseller ID:', resellerId);

    console.log('Updating Aqilla...');
    const { data: updated, error } = await supabase
        .from('customers')
        .update({ member_type_id: resellerId, type_id: resellerId })
        .eq('name', 'Aqilla')
        .select();
    
    if (error) console.error('Update Error:', error);
    else console.log('Update Success:', updated);
}

fixAqilla();
