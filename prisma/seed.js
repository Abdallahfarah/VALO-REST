import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Allow self-signed certificates from Supabase pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function seed() {
  console.log('🌱 Connecting to database...');
  const client = new pg.Client({ connectionString, ssl: true });
  await client.connect();
  console.log('   ✅ Connected!\n');

  const sql = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');
  
  console.log('🚀 Executing seed SQL...');
  await client.query(sql);
  console.log('   ✅ Seed SQL executed!\n');

  // Verify
  console.log('📊 Verification:');
  const tenants = await client.query("SELECT count(*) FROM tenants");
  console.log('   Tenants:', tenants.rows[0].count);
  const cats = await client.query("SELECT count(*) FROM categories");
  console.log('   Categories:', cats.rows[0].count);
  const items = await client.query("SELECT count(*) FROM menu_items");
  console.log('   Menu Items:', items.rows[0].count);
  const tables = await client.query("SELECT count(*) FROM tables");
  console.log('   Tables:', tables.rows[0].count);

  await client.end();
  console.log('\n🎉 Database seeded successfully!');
}

seed().catch(err => { console.error('Fatal seed error:', err); process.exit(1); });
