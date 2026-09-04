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

-- ==========================================================
-- Selesai. Tabel siap digunakan oleh Backend Express V2.
-- ==========================================================

