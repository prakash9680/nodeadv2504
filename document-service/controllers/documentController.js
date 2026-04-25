const sequelize = require('../../shared/config/database');
const { Document, User } = require('../../shared/config/models');
const { getSignedDownloadUrl, getSignedUploadUrl, deleteFromS3 } = require('../../shared/config/s3');
const { publish } = require('../../shared/config/queue');
const { cache } = require('../../shared/config/redis');
const { asyncHandler, ValidationError, NotFoundError } = require('../../shared/middleware/errorHandler');
const sendResponse = require('../../shared/utils/response');

const QUEUE = 'file.upload';

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ValidationError('No file provided');

  const document = await Document.create({
    userId: req.user.id,
    originalName: req.file.originalname,
    s3Key: 'pending',
    mimeType: req.file.mimetype,
    size: req.file.size,
    status: 'processing',
    progress: 0,
  });

  // Publish to queue — upload-service will pick it up
  await publish(QUEUE, {
    documentId: document.id,
    userId: req.user.id,
    filePath: req.file.path,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    fileSize: req.file.size,
  });

  sendResponse(res, {
    statusCode: 202,
    message: 'Upload accepted, processing in background',
    data: {
      id: document.id,
      originalName: document.originalName,
      size: document.size,
      status: 'processing',
      progress: 0,
      trackUrl: `/api/documents/${document.id}/progress`,
    },
  });
});

exports.list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;

  const cacheKey = `docs:${req.user.id}:${page}:${limit}:${status || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return sendResponse(res, { data: cached.documents, meta: { total: cached.total, page: cached.page, totalPages: cached.totalPages } });

  const where = { userId: req.user.id };
  if (status) where.status = status;
  if (req.user.role === 'admin') delete where.userId;

  const docs = await Document.findAndCountAll({
    where,
    attributes: { exclude: ['s3Key'] },
    include: req.user.role === 'admin'
      ? [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
      : [],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  const result = { documents: docs.rows, total: docs.count, page, totalPages: Math.ceil(docs.count / limit) };
  await cache.set(cacheKey, result, 120);
  sendResponse(res, { data: docs.rows, meta: { total: docs.count, page, totalPages: Math.ceil(docs.count / limit) } });
});

exports.getById = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({
    where: { id: req.params.id, ...(req.user.role !== 'admin' && { userId: req.user.id }) },
    attributes: { exclude: ['s3Key'] },
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
  });
  if (!doc) throw new NotFoundError('Document');
  sendResponse(res, { data: doc });
});

exports.getProgress = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({
    where: { id: req.params.id, ...(req.user.role !== 'admin' && { userId: req.user.id }) },
    attributes: ['id', 'originalName', 'status', 'progress'],
  });
  if (!doc) throw new NotFoundError('Document');
  sendResponse(res, { data: doc });
});

exports.download = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({
    where: { id: req.params.id, ...(req.user.role !== 'admin' && { userId: req.user.id }) },
  });
  if (!doc) throw new NotFoundError('Document');
  const url = await getSignedDownloadUrl(doc.s3Key, 600);
  sendResponse(res, { data: { downloadUrl: url, expiresIn: 600 } });
});

exports.remove = asyncHandler(async (req, res) => {
  await sequelize.transaction(async (t) => {
    const doc = await Document.findOne({
      where: { id: req.params.id, ...(req.user.role !== 'admin' && { userId: req.user.id }) },
      transaction: t,
    });
    if (!doc) throw new NotFoundError('Document');
    await deleteFromS3(doc.s3Key);
    await doc.destroy({ transaction: t });
  });
  await cache.delPattern(`docs:${req.user.id}:*`);
  sendResponse(res, { message: 'Document deleted' });
});
