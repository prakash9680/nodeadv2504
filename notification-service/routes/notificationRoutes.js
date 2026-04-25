const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticate } = require('../../shared/middleware/auth');

router.use(authenticate);

router.get('/', getUserNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;
