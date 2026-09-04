const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_restaurant_jwt_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Register User Baru
 * Catatan: Jika database masih kosong (belum ada user sama sekali),
 * akun pertama dapat mendaftar sebagai 'admin' secara otomatis untuk setup awal.
 */
exports.register = async (req, res) => {
    try {
        const { full_name, email, password, role } = req.body;

        // 1. Cek apakah email sudah terdaftar
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (findError) {
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat memeriksa pengguna: ' + findError.message
            });
        }

        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
            });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Tentukan role (default: kasir, atau role yang dipilih jika valid)
        const userRole = role || 'kasir';

        // 4. Simpan ke database
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                full_name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: userRole
            }])
            .select('id, full_name, email, role, created_at')
            .single();

        if (insertError) {
            return res.status(500).json({
                status: 'error',
                message: 'Gagal membuat pengguna: ' + insertError.message
            });
        }

        // 5. Generate token JWT untuk langsung login
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role, full_name: newUser.full_name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            status: 'success',
            message: 'Registrasi berhasil',
            data: {
                user: newUser,
                token
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server: ' + err.message
        });
    }
};

/**
 * Login Pengguna
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Cari pengguna berdasarkan email
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (findError) {
            return res.status(500).json({
                status: 'error',
                message: 'Gagal mengambil data login: ' + findError.message
            });
        }

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Email atau kata sandi tidak cocok'
            });
        }

        // 2. Verifikasi kata sandi dengan bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Email atau kata sandi tidak cocok'
            });
        }

        // 3. Generate token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            status: 'success',
            message: 'Login berhasil',
            data: {
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url || null,
                    created_at: user.created_at
                },
                token
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server: ' + err.message
        });
    }
};

/**
 * Mendapatkan profil pengguna aktif yang sedang login
 */
exports.getProfile = async (req, res) => {
    try {
        let { data: user, error } = await supabase
            .from('users')
            .select('id, full_name, email, role, avatar_url, created_at')
            .eq('id', req.user.id)
            .maybeSingle();

        // Fallback jika kolom avatar_url belum ditambahkan di database
        if (error && error.message && error.message.includes('avatar_url')) {
            const fallback = await supabase
                .from('users')
                .select('id, full_name, email, role, created_at')
                .eq('id', req.user.id)
                .maybeSingle();
            user = fallback.data;
            error = fallback.error;
        }

        if (error || !user) {
            return res.status(404).json({
                status: 'error',
                message: 'Pengguna tidak ditemukan'
            });
        }

        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server: ' + err.message
        });
    }
};

/**
 * Memperbarui profil pengguna aktif (Nama, Email, Password, dan Foto Profil)
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, email, password, current_password, avatar_url } = req.body;

        // 1. Ambil data user yang ada
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (findError || !user) {
            return res.status(404).json({
                status: 'error',
                message: 'Pengguna tidak ditemukan'
            });
        }

        const updateData = {};

        // 2. Update Nama
        if (full_name && full_name.trim()) {
            updateData.full_name = full_name.trim();
        }

        // 3. Update Email (cek apakah email baru sudah dipakai orang lain)
        if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.trim().toLowerCase())
                .neq('id', userId)
                .maybeSingle();

            if (existingUser) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Email baru sudah digunakan oleh akun lain. Silakan pilih email berbeda.'
                });
            }
            updateData.email = email.trim().toLowerCase();
        }

        // 4. Update Password (jika diisi)
        if (password && password.trim()) {
            // Verifikasi password saat ini jika ada
            if (current_password) {
                const isMatch = await bcrypt.compare(current_password, user.password);
                if (!isMatch) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Password lama (saat ini) salah. Silakan periksa kembali.'
                    });
                }
            }

            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password.trim(), salt);
        }

        // 5. Update Foto Profil / Avatar (jika ada file diunggah via multipart atau kirim string url)
        if (req.file) {
            updateData.avatar_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (avatar_url !== undefined) {
            updateData.avatar_url = avatar_url || null;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Tidak ada perubahan data yang dikirim.'
            });
        }

        // 6. Jalankan update ke Supabase
        let { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, full_name, email, role, avatar_url, created_at')
            .maybeSingle();

        // Jika kolom avatar_url belum ada di database, ulangi tanpa avatar_url
        if (updateError && updateError.message && updateError.message.includes('avatar_url')) {
            delete updateData.avatar_url;
            const fallback = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select('id, full_name, email, role, created_at')
                .maybeSingle();
            updatedUser = fallback.data;
            updateError = fallback.error;
        }

        if (updateError) {
            return res.status(500).json({
                status: 'error',
                message: 'Gagal memperbarui profil: ' + updateError.message
            });
        }

        // 7. Buat token JWT baru dengan data terbaru
        const newToken = jwt.sign(
            {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                full_name: updatedUser.full_name
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            status: 'success',
            message: 'Profil berhasil diperbarui',
            data: {
                user: updatedUser,
                token: newToken
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server: ' + err.message
        });
    }
};

