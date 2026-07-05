import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lyisewdjlkyahtvrgerj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aXNld2RqbGt5YWh0dnJnZXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjY2MDAsImV4cCI6MjA5ODE0MjYwMH0.9qfxHzO4HVh6ToCW7wykek-d6J1dTfv2a6sZL87j7Rs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = `test_owner_${Math.floor(Math.random() * 100000)}@valo.rest`;
  const password = 'Password123';
  const restaurantName = 'Automated Test Cafe';
  const fullName = 'Test Owner';

  console.log(`🤖 Attempting sign up for: ${email}`);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          restaurant_name: restaurantName,
          role: 'ADMIN',
        },
      },
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      return;
    }

    console.log('✅ Sign up response data user:', data.user ? { id: data.user.id, email: data.user.email } : 'No user');
    console.log('✅ Sign up response session:', data.session ? 'Session created' : 'No session (check email verification setting)');

    // If session is active or we can check public.users
    if (data.user) {
      console.log('🔍 Checking if public.users entry was created...');
      // Note: we can't query users directly without authentication, but since we are anonymous, let's see.
      // Wait, is there RLS on users? Yes, we added it. Let's see if we can log in and then read.
      console.log('🔑 Logging in with newly created user...');
      const { data: logData, error: logError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (logError) {
        console.error('❌ Login error:', logError);
        return;
      }

      console.log('✅ Login successful. Session token present.');

      const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        }
      });
      await authSupabase.auth.setSession(logData.session);

      console.log('👤 Fetching public.users entry...');
      const { data: userProfile, error: profileError } = await authSupabase
        .from('users')
        .select('*, tenants(*)')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
      } else {
        console.log('✅ Profile found in public.users:');
        console.log(JSON.stringify(userProfile, null, 2));
      }
    }
  } catch (err) {
    console.error('💥 Execution exception:', err);
  }
}

run();
