const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const PITCH_UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/pitches');
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

fs.mkdirSync(PITCH_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, PITCH_UPLOAD_DIR),
  filename: (req, file, callback) => {
    const extension = ALLOWED_IMAGE_TYPES.get(file.mimetype);
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

function imageFileFilter(req, file, callback) {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    const error = new Error('Ảnh sân chỉ chấp nhận JPG, PNG hoặc WebP.');
    error.status = 422;
    error.code = 'INVALID_IMAGE_TYPE';
    return callback(error);
  }

  return callback(null, true);
}

const pitchImageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: imageFileFilter,
});

function hasValidImageSignature(file) {
  if (!file?.path || !file.mimetype) return true;

  const descriptor = fs.openSync(file.path, 'r');
  const buffer = Buffer.alloc(12);
  try {
    fs.readSync(descriptor, buffer, 0, buffer.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }

  if (file.mimetype === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (file.mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (file.mimetype === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

function validatePitchImageSignature(req, res, next) {
  if (!req.file || hasValidImageSignature(req.file)) return next();

  removeUploadedFile(req.file);
  req.file = null;
  const error = new Error('Nội dung file không khớp định dạng ảnh JPG, PNG hoặc WebP.');
  error.status = 422;
  error.code = 'INVALID_IMAGE_CONTENT';
  return next(error);
}

function removeUploadedFile(file) {
  if (!file?.path) return;
  fs.unlink(file.path, () => {});
}

function removePublicPitchImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/pitches/')) return;
  const relativePath = imageUrl.replace(/^\/+/, '');
  const absolutePath = path.resolve(process.cwd(), 'public', relativePath);
  const allowedRoot = `${PITCH_UPLOAD_DIR}${path.sep}`;

  if (!absolutePath.startsWith(allowedRoot)) return;
  fs.unlink(absolutePath, () => {});
}

module.exports = {
  pitchImageUpload,
  removeUploadedFile,
  removePublicPitchImage,
  MAX_IMAGE_SIZE,
  validatePitchImageSignature,
};
