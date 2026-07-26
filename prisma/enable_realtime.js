import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

const client = new pg.Client({ connectionString });

async function enableRealtime() {
  try {
    await client.connect();
    console.log("Connected to database...");

    const tables = [
      'orders',
      'order_items',
      'tables',
      'receipts',
      'notifications',
      'activity_logs'
    ];

    const res = await client.query(`
      SELECT c.relname AS tablename
      FROM pg_publication p
      JOIN pg_publication_rel pr ON p.oid = pr.prpubid
      JOIN pg_class c ON pr.prrelid = c.oid
      WHERE p.pubname = 'supabase_realtime';
    `);
    
    const existingTables = res.rows.map(r => r.tablename);
    console.log("Existing tables in supabase_realtime:", existingTables);

    const tablesToAdd = tables.filter(t => !existingTables.includes(t));

    if (tablesToAdd.length > 0) {
      console.log("Adding tables to supabase_realtime: " + tablesToAdd.join(', '));
      await client.query("ALTER PUBLICATION supabase_realtime ADD TABLE " + tablesToAdd.join(', '));
      console.log("Successfully added tables to realtime publication.");
    } else {
      console.log("All required tables are already in the realtime publication.");
    }

    console.log("Setting REPLICA IDENTITY FULL on core tables...");
    await client.query("ALTER TABLE orders REPLICA IDENTITY FULL");
    await client.query("ALTER TABLE order_items REPLICA IDENTITY FULL");
    await client.query("ALTER TABLE tables REPLICA IDENTITY FULL");
    console.log("REPLICA IDENTITY updated.");

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

enableRealtime();
