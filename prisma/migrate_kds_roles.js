import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

const client = new pg.Client({ connectionString });

async function run() {
  try {
    await client.connect();
    console.log('Connected to database. Applying KDS roles and schema changes...');
    
    try {
      await client.query("ALTER TYPE user_role ADD VALUE 'CHEF';");
      console.log('Added CHEF to user_role');
    } catch (e) {
      if (!e.message.includes('already exists')) console.error(e);
    }
    
    try {
      await client.query("ALTER TYPE user_role ADD VALUE 'BARISTA';");
      console.log('Added BARISTA to user_role');
    } catch (e) {
      if (!e.message.includes('already exists')) console.error(e);
    }

    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_station VARCHAR(100);");
    console.log('Added assigned_station to users');

    console.log('Schema changes applied successfully!');
  } catch (err) {
    console.error('Error applying schema changes:', err);
  } finally {
    await client.end();
  }
}

run();
