require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET;

async function getSignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

// Presigned PUT URL — client uploads directly to S3
async function getSignedUploadUrl(originalName, mimetype, expiresIn = 600) {
  const key = `documents/${uuidv4()}${path.extname(originalName)}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimetype,
  });
  const url = await getSignedUrl(s3, command, { expiresIn });
  return { url, key, expiresIn };
}

async function deleteFromS3(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { getSignedDownloadUrl, getSignedUploadUrl, deleteFromS3 };
