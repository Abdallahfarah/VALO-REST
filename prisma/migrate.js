import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres.lyisewdjlkyahtvrgerj:%2A0915727647@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

const sql = `
-- =========================================================================
-- VALO-REST ENTERPRISE SAAS SCHEMA MIGRATIONS (WITH ONBOARDING TRIGGER)
-- =========================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo TEXT,
    primary_color VARCHAR(50) DEFAULT '#F97316',
    secondary_color VARCHAR(50) DEFAULT '#0B1630',
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    currency_code VARCHAR(10) DEFAULT 'ETB',
    currency_symbol VARCHAR(10) DEFAULT 'ETB',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. PLANS TABLE
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    features JSONB DEFAULT '[]'::jsonb,
    max_users INT DEFAULT -1,
    max_tables INT DEFAULT -1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RESTAURANT SETTINGS TABLE
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    timezone VARCHAR(100) DEFAULT 'UTC',
    tax_rate DECIMAL(5, 2) DEFAULT 15.00,
    receipt_footer TEXT DEFAULT 'Thank you for dining with us!',
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#F97316',
    secondary_color VARCHAR(50) DEFAULT '#0B1630',
    business_hours JSONB DEFAULT '{"mon_fri": "08:00 AM - 10:00 PM", "sat_sun": "09:00 AM - 11:00 PM"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PAID',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, user_id)
);

-- 8. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for Performance optimization on new tables
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_settings_tenant ON restaurant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);

-- Seed Initial SaaS Plans (if empty)
INSERT INTO plans (name, price, features, max_users, max_tables)
VALUES 
  ('BASIC', 29.00, '["pos", "menu", "tables"]'::jsonb, 5, 10),
  ('PRO', 79.00, '["pos", "menu", "tables", "kds", "cashier", "messaging"]'::jsonb, 15, 30),
  ('ENTERPRISE', 199.00, '["pos", "menu", "tables", "kds", "cashier", "messaging", "reports", "custom_branding"]'::jsonb, -1, -1)
ON CONFLICT (name) DO NOTHING;

-- Seed default VALO-Main Tenant if not exist
INSERT INTO tenants (id, name, slug, is_active, currency_code, currency_symbol)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'VALO Main Bistro', 'valo-main', true, 'USD', '$')
ON CONFLICT (id) DO NOTHING;

-- Seed default plans/subscriptions for VALO-Main
INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_end)
SELECT 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  id,
  'ACTIVE',
  NOW() + INTERVAL '1 year'
FROM plans
WHERE name = 'ENTERPRISE'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Seed default settings for VALO-Main
INSERT INTO restaurant_settings (tenant_id, timezone, tax_rate, receipt_footer)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'UTC', 15.00, 'Thank you for dining with VALO Bistro!')
ON CONFLICT (tenant_id) DO NOTHING;

-- =========================================================================
-- UPDATED HANDLE_NEW_USER TRIGGER (ATOMIC ONBOARDING & DATA SEEDING)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id uuid;
  new_tenant_slug text;
  restaurant_name text;
  full_name text;
  first_name_val text;
  last_name_val text;
  space_pos integer;
  pro_plan_id uuid;
  user_role_val user_role;
BEGIN
  -- Extract details from metadata
  restaurant_name := new.raw_user_meta_data->>'restaurant_name';
  full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Owner');
  user_role_val := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'WAITER'::user_role);

  -- Split full name into first and last
  space_pos := position(' ' in full_name);
  IF space_pos > 0 THEN
    first_name_val := substring(full_name from 1 for space_pos - 1);
    last_name_val := substring(full_name from space_pos + 1);
  ELSE
    first_name_val := full_name;
    last_name_val := 'Owner';
  END IF;

  -- If restaurant_name is provided and the role is ADMIN, provision tenant atomically
  IF restaurant_name IS NOT NULL AND user_role_val = 'ADMIN'::user_role THEN
    -- Generate slug
    new_tenant_slug := lower(regexp_replace(restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
    new_tenant_slug := trim(both '-' from new_tenant_slug);
    
    WHILE EXISTS (SELECT 1 FROM tenants WHERE slug = new_tenant_slug) LOOP
      new_tenant_slug := new_tenant_slug || '-' || floor(random() * 1000)::text;
    END LOOP;

    -- Create Tenant
    INSERT INTO tenants (name, slug, is_active, currency_code, currency_symbol)
    VALUES (
      restaurant_name, 
      new_tenant_slug, 
      true,
      COALESCE(new.raw_user_meta_data->>'currency', 'ETB'),
      CASE WHEN (new.raw_user_meta_data->>'currency') = 'USD' THEN '$' ELSE COALESCE(new.raw_user_meta_data->>'currency', 'ETB') END
    )
    RETURNING id INTO new_tenant_id;

    -- Create Restaurant Settings
    INSERT INTO restaurant_settings (tenant_id, timezone, tax_rate, receipt_footer)
    VALUES (new_tenant_id, 'UTC', 15.00, 'Thank you for dining with ' || restaurant_name || '!');

    -- Create subscription
    SELECT id INTO pro_plan_id FROM plans WHERE name = 'PRO' LIMIT 1;
    IF pro_plan_id IS NOT NULL THEN
      INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_end)
      VALUES (new_tenant_id, pro_plan_id, 'ACTIVE', NOW() + INTERVAL '30 days');
    END IF;

    -- Seed default categories
    INSERT INTO categories (tenant_id, name, sort_order) VALUES
      (new_tenant_id, 'Burgers', 1),
      (new_tenant_id, 'Pizza', 2),
      (new_tenant_id, 'Drinks', 3),
      (new_tenant_id, 'Desserts', 4);

    -- Seed default tables
    INSERT INTO tables (tenant_id, number, capacity, status) VALUES
      (new_tenant_id, '1', 2, 'AVAILABLE'),
      (new_tenant_id, '2', 2, 'AVAILABLE'),
      (new_tenant_id, '3', 4, 'AVAILABLE'),
      (new_tenant_id, '4', 4, 'AVAILABLE'),
      (new_tenant_id, '5', 6, 'AVAILABLE');

    -- Seed default menu items
    INSERT INTO menu_items (tenant_id, category_id, name, description, price, icon)
    SELECT new_tenant_id, c.id, 'Classic Cheeseburger', 'Flame-grilled beef patty, cheddar, pickles, house sauce', 290.00, '🍔'
    FROM categories c WHERE c.tenant_id = new_tenant_id AND c.name = 'Burgers';

    INSERT INTO menu_items (tenant_id, category_id, name, description, price, icon)
    SELECT new_tenant_id, c.id, 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, basil, olive oil', 310.00, '🍕'
    FROM categories c WHERE c.tenant_id = new_tenant_id AND c.name = 'Pizza';

    INSERT INTO menu_items (tenant_id, category_id, name, description, price, icon)
    SELECT new_tenant_id, c.id, 'Coca Cola', 'Chilled soft drink (330ml)', 45.00, '🥤'
    FROM categories c WHERE c.tenant_id = new_tenant_id AND c.name = 'Drinks';

    INSERT INTO menu_items (tenant_id, category_id, name, description, price, icon)
    SELECT new_tenant_id, c.id, 'Chocolate Fudge Cake', 'Rich chocolate cake with fudge icing', 150.00, '🍰'
    FROM categories c WHERE c.tenant_id = new_tenant_id AND c.name = 'Desserts';

  ELSE
    -- Try to read tenant_id from user metadata if provided
    new_tenant_id := NULLIF(new.raw_user_meta_data->>'tenant_id', '')::uuid;
  END IF;

  -- Create public.users entry (with role, email, name, and tenant_id)
  INSERT INTO public.users (id, tenant_id, email, first_name, last_name, role, is_active)
  VALUES (
    new.id, 
    new_tenant_id,
    new.email, 
    first_name_val, 
    last_name_val, 
    user_role_val,
    true
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger to ensure it executes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR TENANT ISOLATION
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper macro function to get user tenant_id from JWT or from users table
CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'tenant_id', '')::uuid,
    (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Drop existing policies if any
DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
DROP POLICY IF EXISTS tenant_isolation_users ON users;
DROP POLICY IF EXISTS tenant_isolation_categories ON categories;
DROP POLICY IF EXISTS tenant_public_select_categories ON categories;
DROP POLICY IF EXISTS tenant_isolation_menu_items ON menu_items;
DROP POLICY IF EXISTS tenant_public_select_menu_items ON menu_items;
DROP POLICY IF EXISTS tenant_isolation_tables ON tables;
DROP POLICY IF EXISTS tenant_public_select_tables ON tables;
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
DROP POLICY IF EXISTS tenant_public_insert_orders ON orders;
DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;
DROP POLICY IF EXISTS tenant_public_insert_order_items ON order_items;
DROP POLICY IF EXISTS tenant_isolation_activity_logs ON activity_logs;
DROP POLICY IF EXISTS tenant_isolation_plans ON plans;
DROP POLICY IF EXISTS tenant_isolation_subscriptions ON subscriptions;
DROP POLICY IF EXISTS tenant_isolation_restaurant_settings ON restaurant_settings;
DROP POLICY IF EXISTS tenant_public_select_restaurant_settings ON restaurant_settings;
DROP POLICY IF EXISTS tenant_isolation_receipts ON receipts;
DROP POLICY IF EXISTS tenant_isolation_notifications ON notifications;
DROP POLICY IF EXISTS tenant_public_insert_notifications ON notifications;
DROP POLICY IF EXISTS tenant_isolation_conversations ON conversations;
DROP POLICY IF EXISTS tenant_isolation_conversation_participants ON conversation_participants;
DROP POLICY IF EXISTS tenant_isolation_messages ON messages;

-- 1. Tenants Policies:
-- Allow reading own tenant workspace or checking by slug during onboarding
CREATE POLICY tenant_isolation_tenants ON tenants
    FOR ALL USING (id = current_user_tenant_id() OR auth.uid() IS NULL);

-- 2. Users Policies:
-- Users can see profiles of people in their own tenant. Admins can update.
CREATE POLICY tenant_isolation_users ON users
    FOR ALL USING (tenant_id = current_user_tenant_id() OR id = auth.uid() OR role = 'SUPER_ADMIN');

-- 3. Categories Policies:
CREATE POLICY tenant_isolation_categories ON categories
    FOR ALL TO authenticated USING (tenant_id = current_user_tenant_id());
CREATE POLICY tenant_public_select_categories ON categories
    FOR SELECT TO anon USING (true);

-- 4. Menu Items Policies:
CREATE POLICY tenant_isolation_menu_items ON menu_items
    FOR ALL TO authenticated USING (tenant_id = current_user_tenant_id());
CREATE POLICY tenant_public_select_menu_items ON menu_items
    FOR SELECT TO anon USING (true);

-- 5. Tables Policies:
CREATE POLICY tenant_isolation_tables ON tables
    FOR ALL TO authenticated USING (tenant_id = current_user_tenant_id());
CREATE POLICY tenant_public_select_tables ON tables
    FOR SELECT TO anon USING (true);

-- 6. Orders Policies:
CREATE POLICY tenant_isolation_orders ON orders
    FOR ALL TO authenticated USING (tenant_id = current_user_tenant_id());
CREATE POLICY tenant_public_insert_orders ON orders
    FOR INSERT TO anon WITH CHECK (true);

-- 7. Order Items Policies:
CREATE POLICY tenant_isolation_order_items ON order_items
    FOR ALL TO authenticated USING (
        order_id IN (SELECT id FROM orders WHERE tenant_id = current_user_tenant_id())
    );
CREATE POLICY tenant_public_insert_order_items ON order_items
    FOR INSERT TO anon WITH CHECK (true);

-- 8. Activity Logs Policies:
CREATE POLICY tenant_isolation_activity_logs ON activity_logs
    FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE tenant_id = current_user_tenant_id())
    );

-- 9. Plans Policies (Read-only for all tenants):
CREATE POLICY tenant_isolation_plans ON plans
    FOR SELECT USING (true);

-- 10. Subscriptions Policies:
CREATE POLICY tenant_isolation_subscriptions ON subscriptions
    FOR ALL USING (tenant_id = current_user_tenant_id() OR (SELECT role FROM users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- 11. Restaurant Settings Policies:
CREATE POLICY tenant_isolation_restaurant_settings ON restaurant_settings
    FOR ALL TO authenticated USING (tenant_id = current_user_tenant_id());
CREATE POLICY tenant_public_select_restaurant_settings ON restaurant_settings
    FOR SELECT TO anon USING (true);

-- 12. Receipts Policies:
CREATE POLICY tenant_isolation_receipts ON receipts
    FOR ALL USING (tenant_id = current_user_tenant_id());

-- 13. Notifications Policies:
CREATE POLICY tenant_isolation_notifications ON notifications
    FOR ALL USING (
        tenant_id = current_user_tenant_id() 
        AND (
            user_id = auth.uid() 
            OR role = (SELECT role FROM users WHERE id = auth.uid())
            OR (user_id IS NULL AND role IS NULL)
        )
    );
CREATE POLICY tenant_public_insert_notifications ON notifications
    FOR INSERT TO anon WITH CHECK (true);

-- 14. Conversations Policies:
CREATE POLICY tenant_isolation_conversations ON conversations
    FOR ALL USING (tenant_id = current_user_tenant_id());

-- 15. Conversation Participants Policies:
CREATE POLICY tenant_isolation_conversation_participants ON conversation_participants
    FOR ALL USING (
        conversation_id IN (SELECT id FROM conversations WHERE tenant_id = current_user_tenant_id())
    );

-- 16. Messages Policies:
CREATE POLICY tenant_isolation_messages ON messages
    FOR ALL USING (tenant_id = current_user_tenant_id());

-- 17. Onboard New Restaurant Function
CREATE OR REPLACE FUNCTION public.onboard_new_restaurant(
  p_restaurant_name text,
  p_currency_code text,
  p_plan_name text
)
RETURNS uuid AS $$
DECLARE
  new_tenant_id uuid;
  new_tenant_slug text;
  pro_plan_id uuid;
  currency_symbol_val text;
BEGIN
  -- 1. Check if user already has a tenant assigned
  IF EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND tenant_id IS NOT NULL) THEN
    RAISE EXCEPTION 'This user already belongs to a restaurant workspace.';
  END IF;

  -- 2. Generate slug
  new_tenant_slug := lower(regexp_replace(p_restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  new_tenant_slug := trim(both '-' from new_tenant_slug);
  
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = new_tenant_slug) LOOP
    new_tenant_slug := new_tenant_slug || '-' || floor(random() * 1000)::text;
  END LOOP;

  -- 3. Resolve currency symbol
  currency_symbol_val := CASE 
    WHEN p_currency_code = 'USD' THEN '$'
    WHEN p_currency_code = 'EUR' THEN '€'
    WHEN p_currency_code = 'GBP' THEN '£'
    ELSE p_currency_code
  END;

  -- 4. Create Tenant
  INSERT INTO public.tenants (name, slug, is_active, currency_code, currency_symbol)
  VALUES (p_restaurant_name, new_tenant_slug, true, p_currency_code, currency_symbol_val)
  RETURNING id INTO new_tenant_id;

  -- 5. Create Restaurant Settings (without currency)
  INSERT INTO public.restaurant_settings (tenant_id, timezone, tax_rate, receipt_footer)
  VALUES (new_tenant_id, 'UTC', 15.00, 'Thank you for dining with ' || p_restaurant_name || '!');

  -- 6. Create subscription
  SELECT id INTO pro_plan_id FROM public.plans WHERE name = p_plan_name LIMIT 1;
  IF pro_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (tenant_id, plan_id, status, current_period_end)
    VALUES (new_tenant_id, pro_plan_id, 'ACTIVE', NOW() + INTERVAL '30 days');
  END IF;

  -- 7. Seed default categories
  INSERT INTO public.categories (tenant_id, name, sort_order) VALUES
    (new_tenant_id, 'Burgers', 1),
    (new_tenant_id, 'Pizza', 2),
    (new_tenant_id, 'Drinks', 3),
    (new_tenant_id, 'Desserts', 4);

  -- 8. Seed default tables
  INSERT INTO public.tables (tenant_id, number, capacity, status) VALUES
    (new_tenant_id, '1', 2, 'AVAILABLE'),
    (new_tenant_id, '2', 2, 'AVAILABLE'),
    (new_tenant_id, '3', 4, 'AVAILABLE'),
    (new_tenant_id, '4', 4, 'AVAILABLE'),
    (new_tenant_id, '5', 6, 'AVAILABLE');

  -- 9. Seed default menu items
  INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, icon)
  SELECT new_tenant_id, c.id, 'Classic Cheeseburger', 'Flame-grilled beef patty, cheddar, pickles, house sauce', 290.00, '🍔'
  FROM public.categories c WHERE c.tenant_id = new_tenant_id AND c.name = 'Burgers';

  INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, icon)
  SELECT new_tenant_id, c.id, 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, basil, olive oil', 310.00, '🍕'
  FROM public.categories c WHERE c.tenant_id = new_tenant_id AND c.name = 'Pizza';

  INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, icon)
  SELECT new_tenant_id, c.id, 'Coca Cola', 'Chilled soft drink (330ml)', 45.00, '🥤'
  FROM public.categories c WHERE c.tenant_id = new_tenant_id AND c.name = 'Drinks';

  INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, icon)
  SELECT new_tenant_id, c.id, 'Chocolate Fudge Cake', 'Rich chocolate cake with fudge icing', 150.00, '🍰'
  FROM public.categories c WHERE c.tenant_id = new_tenant_id AND c.name = 'Desserts';

  -- 10. Update user profile to be ADMIN and link to the new tenant
  UPDATE public.users
  SET 
    tenant_id = new_tenant_id,
    role = 'ADMIN'::user_role
  WHERE id = auth.uid();

  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
`;

async function run() {
  const client = new pg.Client({ connectionString, ssl: true });
  await client.connect();
  console.log('🔗 Connected to Supabase PostgreSQL database.');
  
  try {
    console.log('⚡ Running migration SQL...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
