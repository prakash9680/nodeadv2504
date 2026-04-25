const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../../shared/middleware/auth');

router.post('/', authenticate, authorize('vendor'), productController.create);
router.get('/:id', authenticate, authorize('vendor'), productController.getProduct);
router.get('/', authenticate, productController.productList);
router.delete('/:id', authenticate, productController.delete);

module.exports = router;
