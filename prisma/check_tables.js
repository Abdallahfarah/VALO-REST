import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function run() {
  const client = new pg.Client({ connectionString, ssl: true });
  await client.connect();
  
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Tables in database:');
    res.rows.forEach(r => console.log(' - ' + r.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
