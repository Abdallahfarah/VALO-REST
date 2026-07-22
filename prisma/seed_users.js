import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';
const pgClient = new pg.Client({ connectionString, ssl: true });

const TENANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const usersToCreate = [
  { email: 'Abdallaha.f1572@gmail.com', password: '0707937647', role: 'SUPER_ADMIN', first: 'Abdallah', last: 'Farah' },
];

const logLines = [];
function log(msg) { console.log(msg); logLines.push(msg); }

// Supabase uses bcrypt for password hashing via pgcrypto
async function hashPassword(client, plaintext) {
  const result = await client.query("SELECT crypt($1, gen_salt('bf')) AS hash", [plaintext]);
  return result.rows[0].hash;
}

async function seedUsers() {
  log('🌱 Starting VALO-REST multi-role user seeding via direct SQL...\n');
  await pgClient.connect();
  log('   ✅ Connected to database\n');

  try {
    // First, clean up any previous test user
    log('🧹 Cleaning up old test waiter...');
    await pgClient.query("DELETE FROM public.users WHERE email = 'test_waiter@valo.rest'");
    log('   ✅ Cleaned\n');

    for (const u of usersToCreate) {
      log(`👤 Creating ${u.role}: ${u.email}`);
      
      // Check if auth user already exists
      const existing = await pgClient.query('SELECT id FROM auth.users WHERE email = $1', [u.email]);
      
      let userId;
      
      if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        log(`   ℹ️ Auth user already exists with ID: ${userId}`);
      } else {
        // Generate UUID for the new user
        userId = crypto.randomUUID();
        
        // Hash the password using pgcrypto (same method Supabase uses)
        const hashedPassword = await hashPassword(pgClient, u.password);
        
        // Insert directly into auth.users
        await pgClient.query(`
          INSERT INTO auth.users (
            instance_id, id, aud, role, email, 
            encrypted_password, email_confirmed_at, 
            confirmation_sent_at, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at
          ) VALUES (
            '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
            $3, NOW(),
            NOW(), NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            $4::jsonb,
            NOW(), NOW()
          )
        `, [
          userId, 
          u.email, 
          hashedPassword,
          JSON.stringify({ first_name: u.first, last_name: u.last, role: u.role })
        ]);
        
        // Insert into auth.identities (required for Supabase Auth login)
        await pgClient.query(`
          INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
          VALUES ($1, $1, $2, $3::jsonb, 'email', NOW(), NOW(), NOW())
        `, [
          userId,
          u.email,
          JSON.stringify({ sub: userId, email: u.email })
        ]);
        
        log(`   ✅ Auth user created with ID: ${userId}`);
      }
      
      // Upsert into public.users with correct tenant_id and role
      const tenantId = u.role === 'SUPER_ADMIN' ? null : TENANT_ID;
      
      await pgClient.query(`
        INSERT INTO public.users (id, tenant_id, email, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          role = EXCLUDED.role,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          is_active = true
      `, [userId, tenantId, u.email, u.first, u.last, u.role]);
      
      log(`   ✅ Public profile synced: ${u.first} ${u.last} (${u.role})\n`);
    }

    // Verification
    log('📊 Final User Verification Report:');
    const result = await pgClient.query(`
      SELECT u.email, u.first_name, u.last_name, u.role, 
             COALESCE(t.name, '(Platform-wide)') as tenant
      FROM public.users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      ORDER BY u.role
    `);
    
    log('┌──────────────────────────┬────────────┬───────────────┬────────────────────────┐');
    log('│ Email                    │ Name       │ Role          │ Tenant                 │');
    log('├──────────────────────────┼────────────┼───────────────┼────────────────────────┤');
    for (const row of result.rows) {
      const email = row.email.padEnd(24);
      const name = `${row.first_name} ${row.last_name}`.padEnd(10);
      const role = row.role.padEnd(13);
      const tenant = row.tenant.padEnd(22);
      log(`│ ${email} │ ${name} │ ${role} │ ${tenant} │`);
    }
    log('└──────────────────────────┴────────────┴───────────────┴────────────────────────┘');
    
    log('\n🎉 All 5 operational users seeded successfully!');
    log('\n📋 LOGIN CREDENTIALS:');
    for (const u of usersToCreate) {
      log(`   ${u.role.padEnd(14)} → ${u.email} / ${u.password}`);
    }

  } catch (err) {
    log('❌ Seeding Error: ' + err.message + '\n' + err.stack);
  } finally {
    await pgClient.end();
    fs.writeFileSync('seed_users_result.txt', logLines.join('\n'), 'utf-8');
  }
}

seedUsers();
