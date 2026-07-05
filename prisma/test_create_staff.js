import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Login as admin
  console.log('🔑 Logging in as admin@valo.rest...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@valo.rest',
    password: 'Admin@123'
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }

  console.log('✅ Logged in successfully. User ID:', authData.user.id);
  
  // Fetch tenant_id from public.users
  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', authData.user.id)
    .single();

  if (profileErr) {
    console.error('❌ Failed to get profile:', profileErr.message);
    return;
  }

  const tenantId = profile.tenant_id;
  console.log('🏢 Tenant ID:', tenantId);

  // Invoke Edge Function
  console.log('⚡ Invoking create-staff-user Edge Function...');
  const staffEmail = `staff_${Date.now()}@valo.rest`;
  const { data, error } = await supabase.functions.invoke('create-staff-user', {
    body: {
      email: staffEmail,
      password: 'StaffPassword@123',
      role: 'WAITER',
      tenantId,
      fullName: 'Test Staff Member'
    }
  });

  if (error) {
    console.error('❌ Edge Function returned error:', error);
    if (error.context) {
      try {
        const body = await error.context.json();
        console.error('   Error body:', body);
      } catch (e) {
        try {
          const txt = await error.context.text();
          console.error('   Error text:', txt);
        } catch (e2) {}
      }
    }
  } else {
    console.log('✅ Edge Function response data:', data);
  }
}

run().catch(console.error);
