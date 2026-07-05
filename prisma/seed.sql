-- =========================================================================
-- VALO POS - SEED DATA
-- Run this in your Supabase SQL Editor after valo_pos_schema.sql
-- =========================================================================

-- 1. SEED TENANT
INSERT INTO tenants (id, name, slug, phone, email, address, primary_color, secondary_color)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'VALO Enterprise Cafe',
  'valo-main',
  '+251 911 223344',
  'contact@valo.rest',
  'Bole Road, Addis Ababa, Ethiopia',
  '#F97316',
  '#0B1630'
);

-- 2. SEED CATEGORIES
INSERT INTO categories (id, tenant_id, name, sort_order) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Burgers', 1),
  ('c0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pizza', 2),
  ('c0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Drinks', 3),
  ('c0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Desserts', 4);

-- 3. SEED MENU ITEMS
INSERT INTO menu_items (tenant_id, category_id, name, description, price, icon) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000001', 'Classic Cheeseburger', 'Flame-grilled beef patty, cheddar, pickles, house sauce', 290.00, '🍔'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000001', 'Double Bacon Burger', 'Two beef patties, crispy bacon, cheddar cheese, BBQ sauce', 380.00, '🥓'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000001', 'Spicy Chicken Burger', 'Crispy fried chicken breast, spicy mayo, lettuce', 270.00, '🍗'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000002', 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, basil, olive oil', 310.00, '🍕'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000002', 'Pepperoni Supreme', 'Loaded with beef pepperoni, mozzarella, parmesan', 390.00, '🍕'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000003', 'Coca Cola', 'Chilled soft drink (330ml)', 45.00, '🥤'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000003', 'Fresh Avocado Juice', 'Thick, fresh organic avocado juice', 90.00, '🥑'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000003', 'Sparkling Water', 'Local mineral carbonated water', 35.00, '💧'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000004', 'Chocolate Fudge Cake', 'Rich chocolate cake with fudge icing', 150.00, '🍰'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-0000-0000-0000-000000000004', 'Vanilla Gelato', 'Double scoop premium vanilla bean ice cream', 110.00, '🍨');

-- 4. SEED TABLES
INSERT INTO tables (tenant_id, number, capacity, status) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1', 2, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2', 2, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '3', 4, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4', 4, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5', 6, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '6', 8, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '7', 2, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '8', 4, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '9', 4, 'AVAILABLE'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '10', 6, 'AVAILABLE');
