import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lyisewdjlkyahtvrgerj.supabase.co',
  'sb_publishable_pLZZ_bKjBh1E-c4X4F13nQ_yJ5fN-jM'
);

const users = [
  { email: 'admin@valo.rest',      password: 'Admin@123',    role: 'ADMIN' },
  { email: 'waiter@valo.rest',     password: 'Waiter@123',   role: 'WAITER' },
  { email: 'kitchen@valo.rest',    password: 'Kitchen@123',  role: 'KITCHEN_STAFF' },
  { email: 'cashier@valo.rest',    password: 'Cashier@123',  role: 'CASHIER' },
  { email: 'superadmin@valo.rest', password: 'Super@123',    role: 'SUPER_ADMIN' },
];

async function run() {
  let allPassed = true;

  for (const u of users) {
    process.stdout.write(`Testing login: ${u.email} ... `);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });

    if (error) {
      console.log(`❌ FAILED: ${error.message}`);
      allPassed = false;
      continue;
    }

    const session = data.session;
    const meta = data.user?.user_metadata;
    const role = meta?.role;

    if (!session) {
      console.log('❌ FAILED: No session returned');
      allPassed = false;
      continue;
    }

    if (role !== u.role) {
      console.log(`❌ FAILED: Expected role ${u.role}, got ${role}`);
      allPassed = false;
      continue;
    }

    console.log(`✅ OK  (role=${role}, session_expires=${new Date(session.expires_at * 1000).toISOString()})`);
    await supabase.auth.signOut();
  }

  console.log('\n--- Registration test ---');
  const testEmail = `ui_test_${Date.now()}@valo.rest`;
  const { data: regData, error: regErr } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPass@123',
    options: {
      data: {
        full_name: 'UI Test Owner',
        restaurant_name: 'Test Bistro UI',
        role: 'ADMIN',
      },
    },
  });

  if (regErr) {
    console.log(`❌ Registration failed: ${regErr.message}`);
    allPassed = false;
  } else {
    const userId = regData.user?.id;
    console.log(`✅ Registration returned user ID: ${userId}`);
    // Wait a moment for the trigger to run
    await new Promise(r => setTimeout(r, 1500));

    if (regData.session) {
      // Auto-confirmed — check public.users was created
      const { data: profile } = await supabase
        .from('users')
        .select('id, tenant_id, role')
        .eq('id', userId)
        .single();
      if (profile) {
        console.log(`✅ public.users created: tenant_id=${profile.tenant_id}, role=${profile.role}`);

        // Let's verify other onboarded tables
        const { data: tenant } = await supabase.from('tenants').select('name, slug').eq('id', profile.tenant_id).single();
        console.log(`   Tenant Name: ${tenant?.name}, Slug: ${tenant?.slug}`);

        const { data: settings } = await supabase.from('restaurant_settings').select('currency, tax_rate').eq('tenant_id', profile.tenant_id).single();
        console.log(`   Settings: Currency=${settings?.currency}, Tax=${settings?.tax_rate}%`);

        const { data: sub } = await supabase.from('subscriptions').select('plan_id, status').eq('tenant_id', profile.tenant_id).single();
        console.log(`   Subscription Plan Status: ${sub?.status}`);

        const { data: categories } = await supabase.from('categories').select('name').eq('tenant_id', profile.tenant_id);
        console.log(`   Categories Seeded: ${categories?.map(c => c.name).join(', ')}`);

        const { data: tables } = await supabase.from('tables').select('number').eq('tenant_id', profile.tenant_id);
        console.log(`   Tables Seeded: ${tables?.map(t => t.number).join(', ')}`);

        const { data: menuItems } = await supabase.from('menu_items').select('name, price').eq('tenant_id', profile.tenant_id);
        console.log(`   Menu Items Seeded: ${menuItems?.map(m => `${m.name} ($${m.price})`).join(', ')}`);

        const { data: logs } = await supabase.from('activity_logs').select('action, entity_type').eq('user_id', userId);
        console.log(`   Activity Logs Seeded: ${logs?.map(l => `${l.action} on ${l.entity_type}`).join(', ')}`);
        
        if (!logs || logs.length === 0) {
          console.log('❌ activity_logs entry NOT created by trigger');
          allPassed = false;
        } else {
          console.log('✅ activity_logs entry verified successfully');
        }

      } else {
        console.log('❌ public.users row NOT created by trigger');
        allPassed = false;
      }
    } else {
      console.log('ℹ️  Email confirmation required (email verification is ON in project settings)');
      console.log('   To disable: Supabase Dashboard → Auth → Providers → Email → disable "Confirm email"');
    }
  }

  console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
}

run().catch(console.error);
