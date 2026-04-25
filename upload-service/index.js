require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Worker } = require('worker_threads');
const path = require('path');
const { consume } = require('../shared/config/queue');
const { Document, Notification } = require('../shared/config/models');
const { cache } = require('../shared/config/redis');
const sequelize = require('../shared/config/database');
const createLogger = require('../shared/utils/logger');

const logger = createLogger('upload-service');
const QUEUE = 'file.upload';
const PORT = process.env.UPLOAD_PORT || 4008;

function handleUpload(message) {
  const { documentId, userId, filePath, originalName, mimetype, fileSize } = message;
  logger.info(`Processing upload: ${documentId}`);

  const worker = new Worker(
    path.join(__dirname, 'workers', 'uploadWorker.js'),
    { workerData: { filePath, originalName, mimetype, fileSize } }
  );

  worker.on('message', async (msg) => {
    if (msg.type === 'progress') {
      await Document.update({ progress: msg.percentage }, { where: { id: documentId } });
    }

    if (msg.type === 'done' && msg.success) {
      await Document.update(
        { s3Key: msg.s3Key, checksum: msg.checksum, status: 'completed', progress: 100 },
        { where: { id: documentId } }
      );
      await Notification.create({
        userId, documentId, type: 'in_app',
        title: 'Upload Complete',
        message: `Your document "${originalName}" is ready.`,
      });
      await cache.delPattern(`docs:${userId}:*`);
      await cache.delPattern(`notif:${userId}:*`);
      logger.info(`Upload done: ${documentId}`);
    }

    if (msg.type === 'done' && !msg.success) {
      await Document.update({ status: 'failed', progress: 0 }, { where: { id: documentId } });
      await Notification.create({
        userId, documentId, type: 'in_app',
        title: 'Upload Failed',
        message: `Your document "${originalName}" failed. Try again.`,
      });
      await cache.delPattern(`notif:${userId}:*`);
      logger.error(`Upload failed: ${documentId} - ${msg.error}`);
    }
  });

  worker.on('error', async (err) => {
    await Document.update({ status: 'failed', progress: 0 }, { where: { id: documentId } });
    logger.error(`Worker error: ${documentId}`, err);
  });
}

async function start() {
  await sequelize.authenticate();
  logger.info('Database connected');

  await consume(QUEUE, handleUpload);
  logger.info(`Listening on queue: ${QUEUE}`);

  // Health check
  const express = require('express');
  const app = express();
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'upload' }));
  app.listen(PORT, () => logger.info(`Upload service running on port ${PORT}`));
}

start().catch((err) => {
  logger.error('Failed to start upload service', err);
  process.exit(1);
});
