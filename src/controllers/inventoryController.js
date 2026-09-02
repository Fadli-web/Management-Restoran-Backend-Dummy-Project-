const supabase = require('../config/supabaseClient');

exports.getAllInventory = async (req, res) => {
    const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};

exports.getInventoryById = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('inventory').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};

exports.createInventory = async (req, res) => {
    const { item_name, quantity, unit } = req.body;
    const { data, error } = await supabase.from('inventory').insert([{ item_name, quantity, unit }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
};

exports.updateInventory = async (req, res) => {
    const { id } = req.params;
    const { item_name, quantity, unit } = req.body;
    const { data, error } = await supabase.from('inventory').update({ item_name, quantity, unit }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};

exports.deleteInventory = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: 'Item berhasil dihapus' });
};
