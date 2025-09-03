import { join } from 'path';
import { mkdirSync } from 'fs';
import multer from 'multer';

export const createMulter = (excursionId, highestImageNumber = 0) => {
  const uploadPath = join('public', 'excursions', excursionId);

  try {
    mkdirSync(uploadPath, { recursive: true });
  } catch (err) {
    console.error('createMulter: Failed to create directory:', err);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uploadedFiles = req.files ? req.files.length : 0;
      const fileNumber = highestImageNumber + uploadedFiles;
      const extension = file.originalname.split('.').pop();
      cb(null, `img${fileNumber}.${extension}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Seuls les fichiers .jpg, .jpeg et .png sont autorisés'), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 1 * 1024 * 1024, // 1MB
      files: 5,
    },
  }).array('images', 5);
};