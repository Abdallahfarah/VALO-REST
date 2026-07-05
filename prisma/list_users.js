import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function run() {
  const client = new pg.Client({ connectionString, ssl: true });
  await client.connect();

  try {
    const authRes = await client.query('SELECT id, email, created_at, email_confirmed_at, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 10');
    console.log('--- AUTH.USERS ---');
    authRes.rows.forEach(r => {
      console.log(`ID: ${r.id} | Email: ${r.email} | Confirmed: ${r.email_confirmed_at} | Metadata: ${JSON.stringify(r.raw_user_meta_data)}`);
    });

    const publicRes = await client.query('SELECT id, tenant_id, email, role, created_at FROM public.users ORDER BY created_at DESC LIMIT 10');
    console.log('\n--- PUBLIC.USERS ---');
    publicRes.rows.forEach(r => {
      console.log(`ID: ${r.id} | Tenant: ${r.tenant_id} | Email: ${r.email} | Role: ${r.role}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
