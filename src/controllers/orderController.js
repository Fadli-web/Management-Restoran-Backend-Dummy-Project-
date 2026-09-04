const supabase = require('../config/supabaseClient');

/**
 * Mengambil semua pesanan (diurutkan dari yang paling baru)
 */
exports.getAllOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Mengambil detail satu pesanan berdasarkan ID
 */
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) return res.status(500).json({ status: 'error', message: error.message });
        if (!data) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });

        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

/**
 * Membuat Pesanan Baru dengan Otomasi Pemotongan Stok Inventaris
 */
exports.createOrder = async (req, res) => {
    try {
        const { customer_name, items, status = 'pending' } = req.body;
        let { total_price } = req.body;

        // 1. Validasi keberadaan menu yang dipesan & hitung harga jika total_price tidak dikirim
        const menuIds = [...new Set(items.map(i => i.menu_id))];
        const { data: menuList, error: menuError } = await supabase
            .from('menus')
            .select('id, name, price, is_available')
            .in('id', menuIds);

        if (menuError) {
            return res.status(500).json({ status: 'error', message: 'Gagal memverifikasi menu: ' + menuError.message });
        }

        const menuMap = new Map((menuList || []).map(m => [m.id, m]));

        // Pastikan semua menu_id terdaftar dan tersedia
        let calculatedTotal = 0;
        for (const item of items) {
            const menu = menuMap.get(item.menu_id);
            if (!menu) {
                return res.status(404).json({
                    status: 'error',
                    message: `Menu dengan ID ${item.menu_id} tidak ditemukan dalam daftar menu.`
                });
            }
            if (!menu.is_available) {
                return res.status(400).json({
                    status: 'error',
                    message: `Menu "${menu.name}" saat ini sedang tidak tersedia.`
                });
            }
            calculatedTotal += (menu.price * item.qty);
        }

        if (!total_price || total_price <= 0) {
            total_price = calculatedTotal;
        }

        // 2. OTOMASI PEMERIKSAAN RESEP & STOK BAHAN BAKU (INVENTORY)
        // Ambil resep bahan baku dari tabel menu_ingredients untuk menu-menu yang dipesan
        const { data: recipes, error: recipeError } = await supabase
            .from('menu_ingredients')
            .select('menu_id, inventory_id, quantity_needed')
            .in('menu_id', menuIds);

        const deductedStockList = [];

        // Jika tabel menu_ingredients ada dan memiliki relasi resep
        if (!recipeError && recipes && recipes.length > 0) {
            // Hitung total kebutuhan bahan baku untuk semua item pesanan
            const requiredInventory = {}; // inventory_id -> total_needed

            for (const item of items) {
                const itemRecipes = recipes.filter(r => r.menu_id === item.menu_id);
                for (const r of itemRecipes) {
                    requiredInventory[r.inventory_id] = (requiredInventory[r.inventory_id] || 0) + (r.quantity_needed * item.qty);
                }
            }

            const invIds = Object.keys(requiredInventory);
            if (invIds.length > 0) {
                // Ambil data stok saat ini dari tabel inventory
                const { data: invItems, error: invError } = await supabase
                    .from('inventory')
                    .select('id, item_name, quantity, unit')
                    .in('id', invIds);

                if (invError) {
                    return res.status(500).json({
                        status: 'error',
                        message: 'Gagal memeriksa stok bahan baku: ' + invError.message
                    });
                }

                const invMap = new Map((invItems || []).map(i => [i.id, i]));

                // A. Validasi apakah semua stok mencukupi SEBELUM ada yang dipotong
                for (const invId of invIds) {
                    const inv = invMap.get(invId);
                    const needed = requiredInventory[invId];

                    if (!inv) {
                        return res.status(400).json({
                            status: 'error',
                            message: `Bahan baku dengan ID ${invId} tidak ditemukan di inventaris.`
                        });
                    }

                    if (Number(inv.quantity) < needed) {
                        return res.status(400).json({
                            status: 'error',
                            message: `Stok bahan baku "${inv.item_name}" tidak mencukupi! Dibutuhkan: ${needed} ${inv.unit}, tersedia: ${inv.quantity} ${inv.unit}. Pesanan dibatalkan.`
                        });
                    }
                }

                // B. Potong stok otomatis di tabel inventory
                for (const invId of invIds) {
                    const inv = invMap.get(invId);
                    const needed = requiredInventory[invId];
                    const remaining = Number(inv.quantity) - needed;

                    const { error: deductError } = await supabase
                        .from('inventory')
                        .update({ quantity: remaining })
                        .eq('id', invId);

                    if (deductError) {
                        console.error(`Gagal memotong stok untuk ${inv.item_name}:`, deductError);
                    } else {
                        deductedStockList.push({
                            inventory_id: invId,
                            item_name: inv.item_name,
                            deducted: needed,
                            remaining_stock: remaining,
                            unit: inv.unit
                        });
                    }
                }
            }
        } else if (recipeError && recipeError.code !== 'PGRST205' && recipeError.code !== '42P01') {
            console.warn('Peringatan saat membaca resep bahan baku:', recipeError.message);
        }

        // 3. Simpan data pesanan ke tabel orders
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
                customer_name,
                total_price,
                status,
                items
            }])
            .select()
            .single();

        if (orderError) {
            return res.status(500).json({ status: 'error', message: 'Gagal membuat pesanan: ' + orderError.message });
        }

        res.status(201).json({
            status: 'success',
            message: 'Pesanan berhasil dibuat dan stok inventaris telah diperbarui secara otomatis',
            data: {
                order: orderData,
                deducted_ingredients: deductedStockList
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server: ' + err.message });
    }
};

/**
 * Memperbarui status pesanan & Otomasi pengembalian stok jika pesanan dibatalkan
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'pending', 'cooking', 'ready', 'completed', 'cancelled'

        // 1. Ambil data pesanan yang ada sekarang
        const { data: existingOrder, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) return res.status(500).json({ status: 'error', message: fetchError.message });
        if (!existingOrder) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });

        const previousStatus = existingOrder.status;

        // 2. Jika status berubah menjadi 'cancelled', kembalikan stok bahan yang sudah dipotong
        let restoredStockList = [];
        if (status === 'cancelled' && previousStatus !== 'cancelled' && Array.isArray(existingOrder.items)) {
            const menuIds = [...new Set(existingOrder.items.map(i => i.menu_id))];
            
            const { data: recipes } = await supabase
                .from('menu_ingredients')
                .select('menu_id, inventory_id, quantity_needed')
                .in('menu_id', menuIds);

            if (recipes && recipes.length > 0) {
                const toRestore = {};
                for (const item of existingOrder.items) {
                    const itemRecipes = recipes.filter(r => r.menu_id === item.menu_id);
                    for (const r of itemRecipes) {
                        toRestore[r.inventory_id] = (toRestore[r.inventory_id] || 0) + (r.quantity_needed * item.qty);
                    }
                }

                for (const [invId, restoreQty] of Object.entries(toRestore)) {
                    const { data: currentInv } = await supabase
                        .from('inventory')
                        .select('id, item_name, quantity, unit')
                        .eq('id', invId)
                        .maybeSingle();

                    if (currentInv) {
                        const newQuantity = Number(currentInv.quantity) + restoreQty;
                        await supabase.from('inventory').update({ quantity: newQuantity }).eq('id', invId);
                        restoredStockList.push({
                            inventory_id: invId,
                            item_name: currentInv.item_name,
                            restored_amount: restoreQty,
                            current_quantity: newQuantity,
                            unit: currentInv.unit
                        });
                    }
                }
            }
        }

        // 3. Update status pesanan di database
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (updateError) return res.status(500).json({ status: 'error', message: updateError.message });

        res.status(200).json({
            status: 'success',
            message: `Status pesanan berhasil diperbarui menjadi '${status}'`,
            data: {
                order: updatedOrder,
                restored_stock: restoredStockList
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
