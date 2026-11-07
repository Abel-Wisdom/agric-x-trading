
import prisma from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

// VNS 1: DETERMINE CLOUDINARY RESOURCE TYPE
const getResourceType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
};

// VNS 2: UPLOAD FILE BUFFER TO CLOUDINARY
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const resourceType = getResourceType(file.mimetype);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "agric-x-trading",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

// VNS 3: GET ALL MEDIA (ADMIN)
export const getAllMedia = async (req, res) => {
  try {
    const media = await prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("Get media error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve media files.",
    });
  }
};

// VNS 4: PREVIEW PDF (ADMIN)
export const previewMedia = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID.",
      });
    }

    const media = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media file not found.",
      });
    }

    if (media.mimeType !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF documents can be previewed.",
      });
    }

    const cloudResponse = await fetch(media.url);

    if (!cloudResponse.ok || !cloudResponse.body) {
      return res.status(502).json({
        success: false,
        message: "Unable to retrieve the PDF from cloud storage.",
      });
    }

    // Tell the browser to display the document instead of downloading it.
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="document.pdf"'
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    const contentLength = cloudResponse.headers.get("content-length");

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    await pipeline(Readable.fromWeb(cloudResponse.body), res);
  } catch (error) {
    console.error("PDF preview error:", error);

    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    return res.status(500).json({
      success: false,
      message: "Unable to preview this PDF document.",
    });
  }
};

// VNS 5: UPLOAD MEDIA FILES (ADMIN)
export const uploadMedia = async (req, res) => {
  const uploadedMedia = [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one file.",
      });
    }

    for (const file of req.files) {
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

        uploadedMedia.push(media);
      } catch (databaseError) {
        await cloudinary.uploader.destroy(cloudResult.public_id, {
          resource_type: getResourceType(file.mimetype),
        });

        throw databaseError;
      }
    }

    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully.",
      media: uploadedMedia,
    });
  } catch (error) {
    console.error("Upload media error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to upload media files.",
    });
  }
};

// VNS 6: DELETE MEDIA (ADMIN)
export const deleteMedia = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID.",
      });
    }

    const media = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media file not found.",
      });
    }

    // VNS 7: CHECK ALL WEBSITE CONTENT REFERENCES
    const [
      researchCover,
      researchPDF,
      researchContent,
      articleCover,
      serviceCover,
    ] = await Promise.all([
      prisma.researchReport.findFirst({
        where: { coverMediaId: id },
      }),
      prisma.researchReport.findFirst({
        where: { pdfMediaId: id },
      }),
      prisma.researchMedia.findFirst({
        where: { mediaAssetId: id },
      }),
      prisma.article.findFirst({
        where: { coverMediaId: id },
      }),
      prisma.service.findFirst({
        where: { coverMediaId: id },
      }),
    ]);

    if (
      researchCover ||
      researchPDF ||
      researchContent ||
      articleCover ||
      serviceCover
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This media file is currently in use. Remove its content references first.",
      });
    }

    // VNS 8: DELETE THE PERMANENT CLOUDINARY FILE
    if (media.storageKey) {
      const resourceType = getResourceType(media.mimeType);

      const result = await cloudinary.uploader.destroy(
        media.storageKey,
        { resource_type: resourceType }
      );

      if (
        media.mimeType === "application/pdf" &&
        result.result === "not found"
      ) {
        await cloudinary.uploader.destroy(media.storageKey, {
          resource_type: "raw",
        });
      }
    }

    // VNS 9: DELETE THE DATABASE RECORD
    await prisma.mediaAsset.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Media file deleted successfully.",
    });
  } catch (error) {
    console.error("Delete media error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete media file.",
    });
  }
};
