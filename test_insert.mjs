import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

const envPath = '.env';
let dbUrl = '';
let key = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) dbUrl = line.substring(line.indexOf('=') + 1).trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.substring(line.indexOf('=') + 1).trim();
  });
}
// Strip quotes if present
if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) dbUrl = dbUrl.slice(1, -1);
if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);

const supabase = createClient(dbUrl, key);

async function testInsert() {
  const { data, error } = await supabase.from('orders').insert({
    tenant_id: '123e4567-e89b-12d3-a456-426614174000', 
    total_amount: 0,
    order_number: 'ORDER-0001'
  }).select();
  console.log("Insert Error:", error);
}

testInsert();
