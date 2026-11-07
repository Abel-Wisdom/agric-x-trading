
import multer from "multer";

// VNS 1: STORE FILES TEMPORARILY IN MEMORY
const storage = multer.memoryStorage();

// VNS 2: VALIDATE MEDIA LIBRARY FILES
const mediaFileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",

    // Videos
    "video/mp4",
    "video/webm",
    "video/quicktime",

    // PDF documents
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(
    new Error(
      "Only JPEG, PNG, WebP, GIF, MP4, WebM, MOV and PDF files are allowed in the Media Library."
    )
  );
};

// VNS 3: VALIDATE ALL RESEARCH UPLOAD TYPES
const researchFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(
    new Error(
      "Research uploads must be valid images, videos or PDF documents."
    )
  );
};

// VNS 4: MEDIA LIBRARY UPLOAD CONFIGURATION
const upload = multer({
  storage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 20,
  },
});

// VNS 5: RESEARCH-SPECIFIC UPLOAD CONFIGURATION
export const researchUpload = multer({
  storage,
  fileFilter: researchFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 17,
  },
});

export default upload;
