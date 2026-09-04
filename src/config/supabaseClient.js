const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Sanitasi URL Supabase untuk memastikan tidak mengandung akhiran /rest/v1
const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('PERINGATAN KRUSIAL: SUPABASE_URL atau SUPABASE_KEY belum dikonfigurasi di Environment Variables!');
}

let supabase;
try {
    supabase = createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseKey || 'placeholder-key'
    );
} catch (err) {
    console.error('Gagal menginisialisasi Supabase client:', err.message);
}

module.exports = supabase;
