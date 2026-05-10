const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
];

const uploadDirectory = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const diskStorageEngine = multer.diskStorage({
  destination: (_req, _file, done) => {
    done(null, uploadDirectory);
  },
  filename: (_req, file, done) => {
    const uniquePrefix = uuidv4().replace(/-/g, '');
    const sanitizedOriginal = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    done(null, `${uniquePrefix}-${sanitizedOriginal}`);
  },
});

const mimeTypeFilter = (_req, file, done) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    done(null, true);
  } else {
    done(new Error(`File type "${file.mimetype}" is not permitted`), false);
  }
};

const sprintforgeUploader = multer({
  storage: diskStorageEngine,
  fileFilter: mimeTypeFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10 MB
    files: 5,
  },
});

module.exports = sprintforgeUploader;
