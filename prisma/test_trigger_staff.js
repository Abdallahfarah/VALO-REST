import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function run() {
  const client = new pg.Client({ connectionString, ssl: true });
  await client.connect();

  console.log('🔗 Connected to database for trigger dry-run (Staff)...');

  try {
    await client.query('BEGIN');

    // Create a mock auth user
    const userId = '22222222-3333-4444-5555-666666666666';
    const email = 'dryrun_staff@valo.rest';
    
    console.log('⚡ Inserting mock auth user with staff metadata...');
    await client.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, 
        encrypted_password, email_confirmed_at, 
        confirmation_sent_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
        'mock_hash', NOW(),
        NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Test Staff Member", "role": "WAITER", "tenant_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'::jsonb,
        NOW(), NOW()
      )
    `, [userId, email]);

    console.log('✅ Inserted successfully!');
    await client.query('ROLLBACK');
  } catch (err) {
    console.error('❌ Trigger execution failed:');
    console.error('   Message:', err.message);
    console.error('   Detail:', err.detail);
    console.error('   Hint:', err.hint);
    console.error('   Context:', err.context);
    console.error('   Code:', err.code);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

run();
