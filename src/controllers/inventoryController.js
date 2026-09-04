const supabase = require('../config/supabaseClient');

/**
 * Mengambil semua daftar stok inventaris bahan baku
 */
exports.getAllInventory = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Mengambil detail stok bahan baku berdasarkan ID
 */
exports.getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        if (!data) return res.status(404).json({ status: 'error', message: 'Item inventaris tidak ditemukan' });

        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Menambahkan bahan baku baru ke inventaris (Khusus Admin)
 */
exports.createInventory = async (req, res) => {
    try {
        const { item_name, quantity, unit } = req.body;
        const { data, error } = await supabase
            .from('inventory')
            .insert([{ item_name, quantity, unit }])
            .select()
            .single();

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(201).json({ status: 'success', message: 'Bahan baku berhasil ditambahkan', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Memperbarui data bahan baku / penyesuaian kuantitas stok (Admin & Koki)
 */
exports.updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const { data, error } = await supabase
            .from('inventory')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        if (!data) return res.status(404).json({ status: 'error', message: 'Item inventaris tidak ditemukan' });

        res.status(200).json({ status: 'success', message: 'Bahan baku berhasil diperbarui', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Menghapus bahan baku dari inventaris (Khusus Admin)
 */
exports.deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('inventory').delete().eq('id', id);

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(200).json({ status: 'success', message: 'Item inventaris berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
