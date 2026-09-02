const supabase = require('../config/supabaseClient');

exports.getAllOrders = async (req, res) => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};

exports.createOrder = async (req, res) => {
    // Payload contoh: { customer_name: "Budi", total_price: 50000, items: [{menu_id: 1, qty: 2}] }
    const { customer_name, total_price, items, status = 'pending' } = req.body;
    
    const { data, error } = await supabase
        .from('orders')
        .insert([{ customer_name, total_price, status, items }])
        .select()
        .single();
        
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Pesanan berhasil dibuat', order: data });
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'completed', 'cancelled'
    
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select();
        
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};
