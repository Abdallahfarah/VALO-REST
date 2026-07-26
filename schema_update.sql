ALTER TABLE restaurant_settings 
ADD COLUMN IF NOT EXISTS receipt_header_name VARCHAR,
ADD COLUMN IF NOT EXISTS receipt_header_address VARCHAR,
ADD COLUMN IF NOT EXISTS receipt_header_city VARCHAR,
ADD COLUMN IF NOT EXISTS receipt_header_phone VARCHAR,
ADD COLUMN IF NOT EXISTS receipt_header_email VARCHAR,
ADD COLUMN IF NOT EXISTS tax_number VARCHAR,
ADD COLUMN IF NOT EXISTS business_reg_number VARCHAR;
