process.env.NODE_ENV = 'test';
const assert = require('assert');
const app = require('../src/index');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_restaurant_jwt_key_2024';

console.log('--- MEMULAI PENGUJIAN BACKEND RESTORAN V2 ---');

// Helper untuk simulasi request HTTP internal
function mockReqRes(options = {}) {
    const req = {
        method: options.method || 'GET',
        url: options.url || '/',
        headers: options.headers || {},
        body: options.body || {},
        params: options.params || {},
        query: options.query || {},
        user: options.user || null
    };

    let statusCode = 200;
    let responseData = null;

    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        },
        send(data) {
            responseData = data;
            return this;
        },
        getStatus() { return statusCode; },
        getData() { return responseData; }
    };

    return { req, res };
}

// 1. UJI VALIDATOR JOI
console.log('\n[1] Pengujian Skema Validasi Joi...');
const validate = require('../src/middlewares/validate');
const { registerSchema, loginSchema } = require('../src/validators/authValidator');
const { createOrderSchema, updateOrderStatusSchema } = require('../src/validators/orderValidator');
const { createMenuSchema } = require('../src/validators/menuValidator');
const { createInventorySchema } = require('../src/validators/inventoryValidator');

// Test Register Validator (Payload Kosong)
{
    const { req, res } = mockReqRes({ body: {} });
    let nextCalled = false;
    validate(registerSchema)(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.getStatus(), 400, 'Register kosong harus mengembalikan HTTP 400');
    assert.strictEqual(res.getData().status, 'error');
    assert.ok(res.getData().errors.length >= 3, 'Harus mendeteksi minimal 3 field kosong (nama, email, password)');
    console.log('  ✓ Validasi register gagal dengan benar jika field kosong:', res.getData().errors.map(e => e.field));
}

// Test Menu Validator (Harga Negatif)
{
    const { req, res } = mockReqRes({ body: { name: 'Es Teh', price: -5000 } });
    let nextCalled = false;
    validate(createMenuSchema)(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.getStatus(), 400, 'Harga negatif harus ditolak');
    assert.ok(res.getData().errors.some(e => e.field === 'price'));
    console.log('  ✓ Validasi menu menolak harga negatif dengan benar');
}

// Test Inventory Validator (Bahan kosong)
{
    const { req, res } = mockReqRes({ body: { item_name: '', quantity: 10, unit: 'kg' } });
    validate(createInventorySchema)(req, res, () => {});
    assert.strictEqual(res.getStatus(), 400);
    console.log('  ✓ Validasi inventaris menolak item_name kosong');
}

// Test Order Validator (Items kosong)
{
    const { req, res } = mockReqRes({ body: { customer_name: 'Budi', items: [] } });
    validate(createOrderSchema)(req, res, () => {});
    assert.strictEqual(res.getStatus(), 400);
    console.log('  ✓ Validasi order menolak jika daftar items kosong');
}

// Test Order Validator (Status tidak valid)
{
    const { req, res } = mockReqRes({ body: { status: 'status_ngawur' } });
    validate(updateOrderStatusSchema)(req, res, () => {});
    assert.strictEqual(res.getStatus(), 400);
    console.log('  ✓ Validasi status pesanan hanya menerima status yang diizinkan');
}

// 2. UJI AUTHENTICATION & RBAC
console.log('\n[2] Pengujian Middleware Autentikasi & RBAC (Role-Based Access Control)...');
const { authenticate, authorize } = require('../src/middlewares/authMiddleware');

// Test tanpa token
{
    const { req, res } = mockReqRes({ headers: {} });
    authenticate(req, res, () => {});
    assert.strictEqual(res.getStatus(), 401);
    console.log('  ✓ Request tanpa token ditolak dengan HTTP 401');
}

// Test dengan token kadaluwarsa / palsu
{
    const { req, res } = mockReqRes({ headers: { authorization: 'Bearer token_palsu_123' } });
    authenticate(req, res, () => {});
    assert.strictEqual(res.getStatus(), 401);
    console.log('  ✓ Request dengan token tidak valid ditolak dengan HTTP 401');
}

// Test token valid & ekstraksi user
const adminToken = jwt.sign({ id: 'user-admin-1', email: 'admin@resto.com', role: 'admin', full_name: 'Admin Resto' }, JWT_SECRET);
const kasirToken = jwt.sign({ id: 'user-kasir-1', email: 'kasir@resto.com', role: 'kasir', full_name: 'Kasir Satu' }, JWT_SECRET);
const kokiToken = jwt.sign({ id: 'user-koki-1', email: 'koki@resto.com', role: 'koki', full_name: 'Chef Gordon' }, JWT_SECRET);

{
    const { req, res } = mockReqRes({ headers: { authorization: `Bearer ${adminToken}` } });
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.ok(nextCalled, 'Authenticate harus memanggil next() jika token valid');
    assert.strictEqual(req.user.role, 'admin');
    console.log('  ✓ Token admin valid berhasil didekode:', req.user.email);
}

// Test RBAC: Kasir mencoba akses rute khusus Admin
{
    const { req, res } = mockReqRes({ user: { role: 'kasir' } });
    let nextCalled = false;
    authorize('admin')(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.getStatus(), 403, 'Kasir mengakses rute khusus admin harus 403 Forbidden');
    assert.strictEqual(nextCalled, false);
    console.log('  ✓ Kasir dilarang mengakses rute khusus Admin (403 Forbidden)');
}

// Test RBAC: Admin mengakses rute khusus Admin
{
    const { req, res } = mockReqRes({ user: { role: 'admin' } });
    let nextCalled = false;
    authorize('admin')(req, res, () => { nextCalled = true; });
    assert.ok(nextCalled, 'Admin harus diizinkan mengakses rute admin');
    console.log('  ✓ Admin diizinkan mengakses rute Admin (200 OK)');
}

// Test RBAC: Koki mengakses rute inventaris
{
    const { req, res } = mockReqRes({ user: { role: 'koki' } });
    let nextCalled = false;
    authorize('admin', 'koki')(req, res, () => { nextCalled = true; });
    assert.ok(nextCalled, 'Koki diizinkan mengakses rute bersama Admin & Koki');
    console.log('  ✓ Koki diizinkan mengakses rute inventaris penyesuaian bahan');
}

// 3. UJI LOGIKA PEMOTONGAN STOK OTOMATIS
console.log('\n[3] Pengujian Logika Otomasi Pemotongan & Pemeriksaan Stok...');

// Simulasi kasus stok tidak mencukupi
function simulateStockCheck(orderedItems, recipes, inventoryStock) {
    const requiredInventory = {};
    for (const item of orderedItems) {
        const itemRecipes = recipes.filter(r => r.menu_id === item.menu_id);
        for (const r of itemRecipes) {
            requiredInventory[r.inventory_id] = (requiredInventory[r.inventory_id] || 0) + (r.quantity_needed * item.qty);
        }
    }

    for (const invId of Object.keys(requiredInventory)) {
        const inv = inventoryStock[invId];
        const needed = requiredInventory[invId];
        if (!inv || inv.quantity < needed) {
            return {
                sufficient: false,
                error: `Stok ${inv ? inv.item_name : invId} tidak mencukupi! Butuh: ${needed}, Tersedia: ${inv ? inv.quantity : 0}`
            };
        }
    }

    // Potong stok jika cukup
    const updatedStock = { ...inventoryStock };
    for (const invId of Object.keys(requiredInventory)) {
        updatedStock[invId] = {
            ...updatedStock[invId],
            quantity: updatedStock[invId].quantity - requiredInventory[invId]
        };
    }

    return { sufficient: true, updatedStock };
}

const mockRecipes = [
    { menu_id: 'menu-nasgor', inventory_id: 'inv-beras', quantity_needed: 0.2 }, // butuh 0.2 kg beras
    { menu_id: 'menu-nasgor', inventory_id: 'inv-telur', quantity_needed: 1.0 }  // butuh 1 butir telur
];

const mockStockAvailable = {
    'inv-beras': { item_name: 'Beras Putih', quantity: 1.0, unit: 'kg' },
    'inv-telur': { item_name: 'Telur Ayam', quantity: 3, unit: 'butir' }
};

// Skenario A: Pesan 2 porsi Nasi Goreng (Butuh 0.4 kg beras, 2 butir telur -> CUKUP)
{
    const result = simulateStockCheck([{ menu_id: 'menu-nasgor', qty: 2 }], mockRecipes, mockStockAvailable);
    assert.strictEqual(result.sufficient, true);
    assert.strictEqual(result.updatedStock['inv-beras'].quantity, 0.6); // 1.0 - 0.4 = 0.6
    assert.strictEqual(result.updatedStock['inv-telur'].quantity, 1);   // 3 - 2 = 1
    console.log('  ✓ Pesanan 2 porsi berhasil memotong stok: Beras sisa 0.6 kg, Telur sisa 1 butir');
}

// Skenario B: Pesan 5 porsi Nasi Goreng (Butuh 1.0 kg beras, 5 butir telur -> TELUR KURANG karena hanya ada 3)
{
    const result = simulateStockCheck([{ menu_id: 'menu-nasgor', qty: 5 }], mockRecipes, mockStockAvailable);
    assert.strictEqual(result.sufficient, false);
    console.log('  ✓ Pesanan 5 porsi ditolak dengan tepat karena stok kurang:', result.error);
}

console.log('\n=== SEMUA PENGUJIAN BERHASIL 100%! ===\n');
