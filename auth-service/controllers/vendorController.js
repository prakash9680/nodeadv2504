const jwt = require('jsonwebtoken');
const sequelize = require('../../shared/config/database');
const { User, Vendor } = require('../../shared/config/models');
const { asyncHandler, ConflictError, AuthenticationError, NotFoundError, ValidationError } = require('../../shared/middleware/errorHandler');
const { cache, redis } = require('../../shared/config/redis');
const sendResponse = require('../../shared/utils/response');

// Verify vendor
exports.verifyVendor = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new NotFoundError('User');
  if (user.mfaEnabled) throw new ConflictError('MFA is already enabled');

  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(user.email, 'DocPlatform', secret);
  const qrCode = await QRCode.toDataURL(otpAuthUrl);

  // Save secret but don't enable yet — wait for verification
  await user.update({ mfaSecret: secret });
  await cache.del(`user:${req.user.id}`);

  sendResponse(res, {
    message: 'Scan QR code with your authenticator app, then verify with OTP',
    data: { qrCode, otpAuthUrl, secret },
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const users = await User.findAndCountAll({
    attributes: {
      exclude: ['password', 'mfaSecret'],
      include: [
        [
          sequelize.literal(`(SELECT COUNT(*) FROM documents WHERE documents.user_id = User.id)`),
          'documentCount',
        ],
      ],
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  sendResponse(res, {
    data: users.rows,
    meta: { total: users.count, page, totalPages: Math.ceil(users.count / limit) },
  });
});
