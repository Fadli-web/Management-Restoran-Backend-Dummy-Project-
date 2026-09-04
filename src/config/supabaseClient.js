const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Sanitasi URL Supabase untuk memastikan tidak mengandung akhiran /rest/v1
const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Peringatan: SUPABASE_URL atau SUPABASE_KEY belum dikonfigurasi di file .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
