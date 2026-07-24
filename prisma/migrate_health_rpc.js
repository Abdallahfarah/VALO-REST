import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

const sql = `
CREATE OR REPLACE FUNCTION get_system_health_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_conns int;
  storage_bytes bigint;
  total_ten int;
  active_rest int;
  paused_sub int;
  trial_sub int;
  today_new int;
BEGIN
  -- DB Metrics
  SELECT count(*) INTO active_conns FROM pg_stat_activity WHERE state = 'active';
  
  -- Use a safe fallback for database size if current_database() fails
  BEGIN
    SELECT pg_database_size(current_database()) INTO storage_bytes;
  EXCEPTION WHEN OTHERS THEN
    storage_bytes := 0;
  END;
  
  -- Tenant/Subscription Metrics
  SELECT count(*) INTO total_ten FROM tenants;
  SELECT count(*) INTO active_rest FROM tenants WHERE is_active = true;
  SELECT count(*) INTO paused_sub FROM subscriptions WHERE status = 'PAUSED';
  SELECT count(*) INTO trial_sub FROM subscriptions WHERE status = 'TRIAL';
  SELECT count(*) INTO today_new FROM tenants WHERE created_at >= current_date;

  RETURN json_build_object(
    'active_connections', active_conns,
    'storage_usage_bytes', storage_bytes,
    'total_tenants', total_ten,
    'active_restaurants', active_rest,
    'paused_subscriptions', paused_sub,
    'trial_accounts', trial_sub,
    'today_new_registrations', today_new
  );
END;
$$;
`;

const client = new pg.Client({ connectionString });

async function run() {
  try {
    await client.connect();
    console.log('Connected to database. Creating get_system_health_metrics function...');
    await client.query(sql);
    console.log('Function created successfully!');
  } catch (err) {
    console.error('Error creating function:', err);
  } finally {
    await client.end();
  }
}

run();
