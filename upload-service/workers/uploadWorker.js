const { parentPort, workerData } = require('worker_threads');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET;

async function run() {
  const { filePath, originalName, mimetype, fileSize } = workerData;
  const key = `${process.env.AMAZON_PREFIX}/${uuidv4()}${path.extname(originalName)}`;

  // Checksum via stream
  const checksum = await new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });

  parentPort.postMessage({ type: 'progress', percentage: 0 });

  // S3 multipart upload with progress tracking
  const fileStream = fs.createReadStream(filePath);
  const upload = new Upload({
    client: s3,
    params: { Bucket: BUCKET, Key: key, Body: fileStream, ContentType: mimetype },
    partSize: 10 * 1024 * 1024,
    queueSize: 4,
    leavePartsOnError: false,
  });

  let lastReported = 10;
  upload.on('httpUploadProgress', (p) => {
    if (p.loaded && fileSize) {
      // 10-95% range for upload
      const pct = (p.loaded / fileSize)*100;
      if (pct > lastReported) {
        lastReported = pct;
        parentPort.postMessage({ type: 'progress', percentage: pct });
      }
    }
  });

  await upload.done();

  // Cleanup temp file
  fs.unlink(filePath, () => {});

  parentPort.postMessage({ type: 'progress', percentage: 100 });
  parentPort.postMessage({ type: 'done', success: true, checksum, s3Key: key });
}

run().catch((err) => {
  fs.unlink(workerData.filePath, () => {});
  parentPort.postMessage({ type: 'done', success: false, error: err.message });
});
