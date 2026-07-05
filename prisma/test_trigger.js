import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function run() {
  const client = new pg.Client({ connectionString, ssl: true });
  await client.connect();

  console.log('🔗 Connected to database for trigger dry-run...');

  try {
    await client.query('BEGIN');

    // Create a mock auth user
    const userId = '11111111-2222-3333-4444-555555555555';
    const email = 'dryrun@valo.rest';
    
    console.log('⚡ Inserting mock auth user...');
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
        '{"first_name": "Dry", "last_name": "Run", "role": "ADMIN", "restaurant_name": "Dry Run Cafe"}'::jsonb,
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
