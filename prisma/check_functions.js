import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function run() {
  const client = new pg.Client({ connectionString, ssl: true });
  await client.connect();

  try {
    const res = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type,
        external_language
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name;
    `);
    console.log('Functions/Procedures in public schema:');
    res.rows.forEach(r => {
      console.log(` - ${r.routine_name} (${r.routine_type}) -> returns ${r.data_type}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
