const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { createMenuSchema, updateMenuSchema, addIngredientSchema } = require('../validators/menuValidator');

// 1. Publik / Umum (Bisa dilihat siapa saja atau staff)
router.get('/menus', menuController.getAllMenus);
router.get('/menus/:id', menuController.getMenuById);

// 2. Resep Menu (Hanya Admin dan Koki yang dapat melihat)
router.get('/menus/:id/ingredients', authenticate, authorize('admin', 'koki'), menuController.getMenuIngredients);

// 3. Manajemen Menu & Resep (Hanya Admin yang dapat memodifikasi)
router.post('/menus', authenticate, authorize('admin'), validate(createMenuSchema), menuController.createMenu);
router.put('/menus/:id', authenticate, authorize('admin'), validate(updateMenuSchema), menuController.updateMenu);
router.delete('/menus/:id', authenticate, authorize('admin'), menuController.deleteMenu);

router.post('/menus/:id/ingredients', authenticate, authorize('admin'), validate(addIngredientSchema), menuController.addMenuIngredient);
router.delete('/menus/:id/ingredients/:ingredientId', authenticate, authorize('admin'), menuController.deleteMenuIngredient);

module.exports = router;
