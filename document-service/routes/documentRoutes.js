const express = require('express');
const multer = require('multer');
const os = require('os');
const router = express.Router();
const docController = require('../controllers/documentController');
const { authenticate } = require('../../shared/middleware/auth');

// Disk storage — streams file to temp dir instead of loading into RAM
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => cb(null, `upload-${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024 }, // 500 MB default
});

router.use(authenticate);

router.post('', upload.single('file'), docController.upload);
router.get('/', docController.list);
router.get('/:id', docController.getById);
router.get('/:id/progress', docController.getProgress);
router.get('/:id/download', docController.download);
router.delete('/:id', docController.remove);

module.exports = router;
