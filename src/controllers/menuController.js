const supabase = require('../config/supabaseClient');

/**
 * Mengambil seluruh daftar menu
 */
exports.getAllMenus = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Mengambil detail satu menu berdasarkan ID, beserta daftar resep bahan bakunya
 */
exports.getMenuById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: menu, error: menuError } = await supabase
            .from('menus')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (menuError) return res.status(500).json({ status: 'error', message: menuError.message });
        if (!menu) return res.status(404).json({ status: 'error', message: 'Menu tidak ditemukan' });

        // Ambil juga resep bahan baku jika tabel menu_ingredients sudah ada
        const { data: ingredients } = await supabase
            .from('menu_ingredients')
            .select('id, inventory_id, quantity_needed, inventory(id, item_name, unit, quantity)')
            .eq('menu_id', id);

        res.status(200).json({
            status: 'success',
            data: {
                ...menu,
                ingredients: ingredients || []
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Menambahkan menu baru (Khusus Admin)
 */
exports.createMenu = async (req, res) => {
    try {
        let { name, description, price, is_available = true, image_url } = req.body;

        // Jika ada upload file gambar via Multer
        if (req.file) {
            image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (!image_url && req.body.image) {
            image_url = req.body.image;
        } else if (!image_url && req.body.gambar) {
            image_url = req.body.gambar;
        }

        // Normalisasi tipe data jika dikirim via multipart/form-data
        if (typeof price === 'string') {
            price = parseFloat(price);
        }
        if (typeof is_available === 'string') {
            is_available = is_available === 'true' || is_available === '1';
        }

        const insertPayload = {
            name,
            description: description || '',
            price,
            is_available: is_available !== undefined ? is_available : true,
            image_url: image_url || null
        };

        const { data, error } = await supabase
            .from('menus')
            .insert([insertPayload])
            .select()
            .single();

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(201).json({ status: 'success', message: 'Menu berhasil ditambahkan', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Memperbarui data menu (Khusus Admin)
 */
exports.updateMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (req.file) {
            updateData.image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (!updateData.image_url && updateData.image) {
            updateData.image_url = updateData.image;
        } else if (!updateData.image_url && updateData.gambar) {
            updateData.image_url = updateData.gambar;
        }

        // Hapus field pembantu yang bukan kolom di tabel menus
        delete updateData.image;
        delete updateData.gambar;
        delete updateData.foto;
        delete updateData.category;
        delete updateData.kategori;
        delete updateData.jenis;
        delete updateData.nama;
        delete updateData.nama_menu;
        delete updateData.harga;
        delete updateData.deskripsi;

        if (updateData.price !== undefined && typeof updateData.price === 'string') {
            updateData.price = parseFloat(updateData.price);
        }
        if (updateData.is_available !== undefined && typeof updateData.is_available === 'string') {
            updateData.is_available = updateData.is_available === 'true' || updateData.is_available === '1';
        }

        const { data, error } = await supabase
            .from('menus')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        if (!data) return res.status(404).json({ status: 'error', message: 'Menu tidak ditemukan' });

        res.status(200).json({ status: 'success', message: 'Menu berhasil diperbarui', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Menghapus menu (Khusus Admin)
 */
exports.deleteMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('menus').delete().eq('id', id);

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(200).json({ status: 'success', message: 'Menu berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Mengambil daftar resep bahan baku untuk suatu menu
 */
exports.getMenuIngredients = async (req, res) => {
    try {
        const { id: menu_id } = req.params;

        const { data, error } = await supabase
            .from('menu_ingredients')
            .select('id, menu_id, inventory_id, quantity_needed, created_at, inventory(id, item_name, unit, quantity)')
            .eq('menu_id', menu_id);

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Menambahkan atau mengupdate bahan baku pada resep menu (Khusus Admin)
 */
exports.addMenuIngredient = async (req, res) => {
    try {
        const { id: menu_id } = req.params;
        const { inventory_id, quantity_needed } = req.body;

        // Pastikan menu dan bahan inventaris ada
        const { data: menu } = await supabase.from('menus').select('id').eq('id', menu_id).maybeSingle();
        if (!menu) return res.status(404).json({ status: 'error', message: 'Menu tidak ditemukan' });

        const { data: item } = await supabase.from('inventory').select('id, item_name').eq('id', inventory_id).maybeSingle();
        if (!item) return res.status(404).json({ status: 'error', message: 'Bahan inventaris tidak ditemukan' });

        // Simpan / upsert resep bahan
        const { data, error } = await supabase
            .from('menu_ingredients')
            .upsert(
                [{ menu_id, inventory_id, quantity_needed }],
                { onConflict: 'menu_id,inventory_id' }
            )
            .select('*, inventory(item_name, unit)')
            .single();

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(201).json({ status: 'success', message: 'Resep bahan baku berhasil disimpan', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Menghapus bahan baku dari resep menu (Khusus Admin)
 */
exports.deleteMenuIngredient = async (req, res) => {
    try {
        const { id: menu_id, ingredientId } = req.params;

        const { error } = await supabase
            .from('menu_ingredients')
            .delete()
            .match({ id: ingredientId, menu_id });

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(200).json({ status: 'success', message: 'Bahan berhasil dihapus dari resep menu' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
