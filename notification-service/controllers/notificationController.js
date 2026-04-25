const Notification = require('../models/Notification');
const { cache } = require('../../shared/config/redis');
const { asyncHandler, NotFoundError } = require('../../shared/middleware/errorHandler');
const sendResponse = require('../../shared/utils/response');

const getUserNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const cacheKey = `notif:${req.user.id}:${page}:${limit}`;
  const cached = await cache.get(cacheKey);
  if (cached) return sendResponse(res, { data: cached.notifications, meta: { total: cached.total, unread: cached.unread, page: cached.page, totalPages: cached.totalPages } });

  const notifs = await Notification.findAndCountAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  const unread = await Notification.count({ where: { userId: req.user.id, isRead: false } });
  const result = { notifications: notifs.rows, total: notifs.count, unread, page, totalPages: Math.ceil(notifs.count / limit) };

  await cache.set(cacheKey, result, 60);
  sendResponse(res, { data: notifs.rows, meta: { total: notifs.count, unread, page, totalPages: Math.ceil(notifs.count / limit) } });
});

const markAsRead = asyncHandler(async (req, res) => {
  const [updated] = await Notification.update(
    { isRead: true },
    { where: { id: req.params.id, userId: req.user.id } }
  );

  if (!updated) throw new NotFoundError('Notification');

  await cache.delPattern(`notif:${req.user.id}:*`);
  sendResponse(res, { message: 'Marked as read' });
});

module.exports = { getUserNotifications, markAsRead };
