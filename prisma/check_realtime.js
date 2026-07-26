import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

const client = new pg.Client({ connectionString });

async function run() {
  try {
    await client.connect();
    
    // Check which tables are in the supabase_realtime publication
    const res = await client.query(`
      SELECT p.pubname, c.relname AS tablename
      FROM pg_publication p
      JOIN pg_publication_rel pr ON p.oid = pr.prpubid
      JOIN pg_class c ON pr.prrelid = c.oid
      WHERE p.pubname = 'supabase_realtime';
    `);
    
    console.log("Tables in supabase_realtime publication:");
    res.rows.forEach(r => console.log(`- ${r.tablename}`));
    
    if (res.rows.length === 0) {
      console.log("No tables found in realtime publication.");
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
