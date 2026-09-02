const supabase = require('../config/supabaseClient');

exports.getAllMenus = async (req, res) => {
    const { data, error } = await supabase.from('menus').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};

exports.getMenuById = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('menus').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};

exports.createMenu = async (req, res) => {
    const { name, description, price, is_available } = req.body;
    const { data, error } = await supabase.from('menus').insert([{ name, description, price, is_available }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
};

exports.updateMenu = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, is_available } = req.body;
    const { data, error } = await supabase.from('menus').update({ name, description, price, is_available }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};

exports.deleteMenu = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('menus').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: 'Menu berhasil dihapus' });
};
