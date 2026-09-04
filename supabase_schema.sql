-- ==========================================================
-- SKRIP INISIALISASI DATABASE RESTORAN V2 (SUPABASE)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ==========================================================

-- 1. Ekstensi UUID (biasanya sudah aktif di Supabase secara default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL USERS (Untuk Autentikasi & Role RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'kasir' CHECK (role IN ('admin', 'kasir', 'koki')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index untuk mempercepat pencarian user berdasarkan email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. TABEL MENU_INGREDIENTS (Hubungan Resep Menu dengan Bahan Baku Inventaris)
CREATE TABLE IF NOT EXISTS menu_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_needed NUMERIC(10, 2) NOT NULL CHECK (quantity_needed > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_menu_inventory UNIQUE (menu_id, inventory_id)
);

-- Index untuk mempercepat query bahan baku per menu
CREATE INDEX IF NOT EXISTS idx_menu_ingredients_menu_id ON menu_ingredients(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_ingredients_inventory_id ON menu_ingredients(inventory_id);

-- 4. NONAKTIFKAN RLS (Row Level Security) ATAU BERIKAN AKSES PENUH KE SERVICE/ANON
-- Karena otorisasi & verifikasi role dikelola langsung di server backend Express
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 5. TAMBAHKAN KOLOM KATEGORI PADA TABEL MENUS (makanan, minuman, snack)
ALTER TABLE menus ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'makanan';
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'menus_category_check'
    ) THEN
        ALTER TABLE menus ADD CONSTRAINT menus_category_check CHECK (category IN ('makanan', 'minuman', 'snack'));
    END IF;
END $$;

-- Update otomatis menu lama jika kategori belum terisi
UPDATE menus SET category = 'minuman' WHERE (name ILIKE '%kopi%' OR name ILIKE '%teh%' OR name ILIKE '%juice%' OR name ILIKE '%coffee%' OR name ILIKE '%jelly%' OR name ILIKE '%drink%' OR name ILIKE '%es %' OR name ILIKE '%air%') AND (category IS NULL OR category = '' OR category = 'makanan');
UPDATE menus SET category = 'snack' WHERE (name ILIKE '%snack%' OR name ILIKE '%camilan%' OR name ILIKE '%keripik%' OR name ILIKE '%kentang%' OR name ILIKE '%roti%') AND (category IS NULL OR category = '' OR category = 'makanan');
UPDATE menus SET category = 'makanan' WHERE category IS NULL OR category = '';

-- 6. TAMBAHKAN KOLOM AVATAR_URL PADA TABEL USERS (Foto Profil)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- ==========================================================
-- Selesai. Tabel siap digunakan oleh Backend Express V2.
-- ==========================================================

