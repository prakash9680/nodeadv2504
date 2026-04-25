const jwt = require("jsonwebtoken");
const { authenticator } = require("otplib");
const QRCode = require("qrcode");
const sequelize = require("../../shared/config/database");
const { User, Vendor } = require("../../shared/config/models");
const {
  asyncHandler,
  ConflictError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
} = require("../../shared/middleware/errorHandler");
const { cache, redis } = require("../../shared/config/redis");
const sendResponse = require("../../shared/utils/response");

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
  );
}

// Temporary short-lived token for MFA pending state
function signMfaPendingToken(user) {
  return jwt.sign({ id: user.id, mfaPending: true }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });
}

exports.register = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  if (role == "vendor") {
    var { vendor } = req.body;
    if (
      typeof vendor.store_name == undefined ||
      vendor.store_name == null ||
      vendor.store_name == ""
    ) {
      console.log("sadasd");
    }
  }
  const user = await sequelize.transaction(async (t) => {
    const existing = await User.findOne({ where: { email }, transaction: t });
    if (existing) throw new ConflictError("Email already registered");
    return User.create(
      { email, password, name, role: role === "admin" ? "admin" : role },
      { transaction: t },
    );
  });
  const token = signToken(user);
  let vendorData;
  if (role == "vendor") {
    const { store_name, store_description } = vendor;
    vendorData = await Vendor.create({
      userId: user.toSafeJSON().id,
      storeName: store_name,
      storeDescription: store_description,
    });
  }
  let userData = user.toSafeJSON();
  userData.vendor = vendorData;
  sendResponse(res, {
    statusCode: 201,
    message: "User registered",
    data: { token, user: userData },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.validatePassword(password))) {
    throw new AuthenticationError("Invalid credentials");
  }

  // If MFA enabled, return a temporary token and require OTP
  if (user.mfaEnabled) {
    const tempToken = signMfaPendingToken(user);
    return sendResponse(res, {
      message: "MFA required",
      data: { mfaRequired: true, tempToken },
    });
  }

  const token = signToken(user);
  sendResponse(res, {
    message: "Login successful",
    data: { token, user: user.toSafeJSON() },
  });
});

// Step 2 of login: verify OTP when MFA is enabled
exports.verifyLoginOtp = asyncHandler(async (req, res) => {
  const { tempToken, otp } = req.body;
  if (!tempToken || !otp)
    throw new ValidationError("tempToken and otp are required");

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    throw new AuthenticationError("Invalid or expired temp token");
  }

  if (!decoded.mfaPending) throw new AuthenticationError("Invalid temp token");

  const user = await User.findByPk(decoded.id);
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw new AuthenticationError("MFA not configured");
  }

  const valid = authenticator.verify({ token: otp, secret: user.mfaSecret });
  if (!valid) throw new AuthenticationError("Invalid OTP");

  const token = signToken(user);
  sendResponse(res, {
    message: "Login successful",
    data: { token, user: user.toSafeJSON() },
  });
});

// Enable MFA: generate secret + QR code
exports.enableMfa = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new NotFoundError("User");
  if (user.mfaEnabled) throw new ConflictError("MFA is already enabled");

  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(user.email, "DocPlatform", secret);
  const qrCode = await QRCode.toDataURL(otpAuthUrl);

  // Save secret but don't enable yet — wait for verification
  await user.update({ mfaSecret: secret });
  await cache.del(`user:${req.user.id}`);

  sendResponse(res, {
    message: "Scan QR code with your authenticator app, then verify with OTP",
    data: { qrCode, otpAuthUrl, secret },
  });
});

// Confirm MFA setup by verifying first OTP
exports.verifyMfa = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ValidationError("OTP is required");

  const user = await User.findByPk(req.user.id);
  if (!user) throw new NotFoundError("User");
  if (user.mfaEnabled) throw new ConflictError("MFA is already enabled");
  if (!user.mfaSecret) throw new ValidationError("Call enable-mfa first");

  const valid = authenticator.verify({ token: otp, secret: user.mfaSecret });
  if (!valid) throw new AuthenticationError("Invalid OTP");

  await user.update({ mfaEnabled: true });
  await cache.del(`user:${req.user.id}`);

  sendResponse(res, { message: "MFA enabled successfully" });
});

// Disable MFA
exports.disableMfa = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ValidationError("OTP is required to disable MFA");

  const user = await User.findByPk(req.user.id);
  if (!user) throw new NotFoundError("User");
  if (!user.mfaEnabled) throw new ValidationError("MFA is not enabled");

  const valid = authenticator.verify({ token: otp, secret: user.mfaSecret });
  if (!valid) throw new AuthenticationError("Invalid OTP");

  await user.update({ mfaEnabled: false, mfaSecret: null });
  await cache.del(`user:${req.user.id}`);

  sendResponse(res, { message: "MFA disabled successfully" });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  if (ttl > 0) {
    await redis.set(`blacklist:${token}`, "1", "EX", ttl);
  }

  await cache.del(`user:${req.user.id}`);
  sendResponse(res, { message: "Logged out successfully" });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const cacheKey = `user:${req.user.id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return sendResponse(res, { data: cached });

  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password", "mfaSecret"] },
    include: [
      {
        model: Document,
        as: "documents",
        attributes: ["id", "originalName", "status", "createdAt"],
      },
    ],
  });

  if (!user) throw new NotFoundError("User");

  const result = user.toJSON();
  await cache.set(cacheKey, result, 300);
  sendResponse(res, { data: result });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const users = await User.findAndCountAll({
    attributes: {
      exclude: ["password", "mfaSecret"],
      include: [
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM documents WHERE documents.user_id = User.id)`,
          ),
          "documentCount",
        ],
      ],
    },
    order: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });

  sendResponse(res, {
    data: users.rows,
    meta: {
      total: users.count,
      page,
      totalPages: Math.ceil(users.count / limit),
    },
  });
});
