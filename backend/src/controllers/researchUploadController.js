
import prisma from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";
import { Readable } from "stream";

// VNS 1: DETERMINE THE CORRECT CLOUDINARY RESOURCE TYPE
const getResourceType = (mimeType) => {
  if (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf"
  ) {
    return "image";
  }

  if (mimeType.startsWith("video/")) return "video";

  return "raw";
};

// VNS 2: UPLOAD A FILE TO CLOUDINARY
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const resourceType = getResourceType(file.mimetype);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "agric-x-trading/research",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          ...result,
          resourceType,
        });
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

// VNS 3: SAVE UPLOADED FILE DETAILS IN THE DATABASE
const saveMediaAsset = async (file) => {
  const cloudResult = await uploadToCloudinary(file);

  try {
    const media = await prisma.mediaAsset.create({
      data: {
        originalName: file.originalname,
        filename: cloudResult.public_id,
        mimeType: file.mimetype,
        size: file.size,
        url: cloudResult.secure_url,
        storageKey: cloudResult.public_id,
      },
    });

    return media;
  } catch (error) {
    // VNS 3A: REMOVE CLOUDINARY FILE IF DATABASE SAVE FAILS
    await cloudinary.uploader.destroy(cloudResult.public_id, {
      resource_type: cloudResult.resourceType,
    });

    throw error;
  }
};

// VNS 4: UPLOAD RESEARCH COVER, OPTIONAL PDF AND CONTENT MEDIA
export const uploadResearchFiles = async (req, res) => {
  const uploadedAssets = [];

  try {
    const coverFile = req.files?.cover?.[0];
    const pdfFile = req.files?.pdf?.[0];
    const imageFiles = req.files?.contentImages || [];
    const videoFiles = req.files?.contentVideos || [];

    if (
      !coverFile &&
      !pdfFile &&
      imageFiles.length === 0 &&
      videoFiles.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one research file.",
      });
    }

    // VNS 5: VALIDATE THE COVER IMAGE
    if (coverFile && !coverFile.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "The research cover must be an image.",
      });
    }

    // VNS 6: VALIDATE THE OPTIONAL PDF
    if (pdfFile && pdfFile.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "The research document must be a PDF.",
      });
    }

    // VNS 7: UPLOAD COVER IMAGE
    let cover = null;

    if (coverFile) {
      cover = await saveMediaAsset(coverFile);
      uploadedAssets.push(cover);
    }

    // VNS 8: UPLOAD OPTIONAL PDF
    let pdf = null;

    if (pdfFile) {
      pdf = await saveMediaAsset(pdfFile);
      uploadedAssets.push(pdf);
    }

    // VNS 9: UPLOAD CONTENT IMAGES
    const images = [];

    for (const file of imageFiles) {
      const media = await saveMediaAsset(file);

      images.push(media);
      uploadedAssets.push(media);
    }

    // VNS 10: UPLOAD CONTENT VIDEOS
    const videos = [];

    for (const file of videoFiles) {
      const media = await saveMediaAsset(file);

      videos.push(media);
      uploadedAssets.push(media);
    }

    return res.status(201).json({
      success: true,
      message: "Research files uploaded successfully.",
      cover,
      pdf,
      images,
      videos,
    });
  } catch (error) {
    console.error("Research file upload error:", error);

    // VNS 11: CLEAN UP PARTIAL UPLOADS
    for (const asset of uploadedAssets) {
      try {
        const resourceType = getResourceType(asset.mimeType);

        await cloudinary.uploader.destroy(asset.storageKey, {
          resource_type: resourceType,
        });

        await prisma.mediaAsset.delete({
          where: { id: asset.id },
        });
      } catch (cleanupError) {
        console.error("Research upload cleanup error:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to upload research files.",
    });
  }
};
