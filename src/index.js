const express = require('express');
const cors = require('cors');
require('dotenv').config();

const inventoryRoutes = require('./routes/inventoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', inventoryRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);

app.get('/', (req, res) => {
    res.send('API Manajemen Restoran V2 (Inventory, Menu, Orders) Berjalan Lancar!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
