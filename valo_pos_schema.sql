-- =========================================================================
-- VALO ENTERPRISE POS - SUPABASE POSTGRESQL SCHEMA SETTING
-- Execute this script entirely in the Supabase SQL Editor.
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing types if they exist (clean setup)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS table_status CASCADE;

-- Create Custom ENUM Types
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'WAITER', 'KITCHEN_STAFF', 'CASHIER');
CREATE TYPE order_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED');
CREATE TYPE table_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING');

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS / STAFF TABLE (Bound to Supabase Auth users on ID)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Will correspond directly to the UUID of auth.users
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'WAITER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_category UNIQUE (tenant_id, name)
);

-- 4. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    icon VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLES TABLE
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    number VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 4,
    status table_status DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_table_number UNIQUE (tenant_id, number)
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    status order_status DEFAULT 'PENDING',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- snapshot of final price (unitRent * quantity)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for Performance optimization
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tables_tenant ON tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =========================================================================
-- AUTOMATIC AUTH TRACE SYNCHRONIZATION WITH USERS Table
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'first_name', COALESCE(new.raw_user_meta_data->>'full_name', 'First')), 
    COALESCE(new.raw_user_meta_data->>'last_name', 'Last'), 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'WAITER'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
