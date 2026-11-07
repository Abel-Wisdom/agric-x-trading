
import prisma from "../lib/prisma.js";

// VNS 1: GENERATE A UNIQUE VIDEO SLUG
const generateSlug = async (title, excludeId = null) => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseSlug) {
    throw new Error("A valid video title is required to generate a slug.");
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.video.findUnique({
      where: { slug },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// VNS 2: VALIDATE VIDEO STATUS
const validStatus = (status) => {
  return ["Draft", "Published"].includes(status);
};

// VNS 3: VALIDATE OPTIONAL PUBLICATION DATE
const validDate = (date) => {
  if (date === undefined || date === null || date === "") {
    return true;
  }

  return !Number.isNaN(new Date(date).getTime());
};

// VNS 4: VALIDATE UPLOADED VIDEO FILE
const validateVideoMedia = async (mediaId) => {
  const id = Number(mediaId);

  if (!Number.isInteger(id) || id <= 0) {
    return { valid: false, message: "A valid video upload is required." };
  }

  const media = await prisma.mediaAsset.findUnique({
    where: { id },
  });

  if (!media) {
    return { valid: false, message: "The uploaded video could not be found." };
  }

  if (!media.mimeType?.startsWith("video/")) {
    return { valid: false, message: "The selected file must be a video." };
  }

  return { valid: true, media };
};

// VNS 5: VALIDATE OPTIONAL THUMBNAIL
const validateThumbnailMedia = async (mediaId) => {
  if (mediaId === null || mediaId === "") {
    return { valid: true, id: null };
  }

  const id = Number(mediaId);

  if (!Number.isInteger(id) || id <= 0) {
    return { valid: false, message: "Invalid thumbnail selection." };
  }

  const media = await prisma.mediaAsset.findUnique({
    where: { id },
  });

  if (!media) {
    return { valid: false, message: "The selected thumbnail could not be found." };
  }

  if (!media.mimeType?.startsWith("image/")) {
    return { valid: false, message: "The thumbnail must be an image." };
  }

  return { valid: true, id };
};

// VNS 6: SHARED VIDEO RESPONSE RELATIONSHIPS
const videoIncludes = {
  videoMedia: true,
  thumbnailMedia: true,
};

// VNS 7: GET ALL PUBLISHED VIDEOS (PUBLIC)
export const getPublishedVideos = async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      where: { status: "Published" },
      include: videoIncludes,
      orderBy: [
        { publicationDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.status(200).json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Get published videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve videos.",
    });
  }
};

// VNS 8: GET ONE PUBLISHED VIDEO (PUBLIC)
export const getVideoBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const video = await prisma.video.findFirst({
      where: {
        slug,
        status: "Published",
      },
      include: videoIncludes,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    return res.status(200).json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("Get video error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve this video.",
    });
  }
};

// VNS 9: GET ALL VIDEOS (ADMIN)
export const getAllVideos = async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      include: videoIncludes,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Get all videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve videos.",
    });
  }
};

// VNS 10: CREATE VIDEO (ADMIN)
export const createVideo = async (req, res) => {
  try {
    const {
      title,
      presenter,
      publicationDate,
      description,
      status,
      videoMediaId,
      thumbnailMediaId,
    } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Video title and description are required.",
      });
    }

    const videoStatus = status || "Draft";

    if (!validStatus(videoStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video status.",
      });
    }

    if (!validDate(publicationDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid publication date.",
      });
    }

    const videoValidation = await validateVideoMedia(videoMediaId);

    if (!videoValidation.valid) {
      return res.status(400).json({
        success: false,
        message: videoValidation.message,
      });
    }

    const thumbnailValidation = await validateThumbnailMedia(
      thumbnailMediaId
    );

    if (!thumbnailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: thumbnailValidation.message,
      });
    }

    const slug = await generateSlug(title);

    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        slug,
        presenter: presenter?.trim() || null,
        publicationDate: publicationDate
          ? new Date(publicationDate)
          : null,
        description: description.trim(),
        status: videoStatus,
        videoMediaId: videoValidation.media.id,
        thumbnailMediaId: thumbnailValidation.id,
      },
      include: videoIncludes,
    });

    return res.status(201).json({
      success: true,
      message: "Video created successfully.",
      video,
    });
  } catch (error) {
    console.error("Create video error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create video.",
    });
  }
};

// VNS 11: UPDATE VIDEO (ADMIN)
export const updateVideo = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID.",
      });
    }

    const existing = await prisma.video.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    const {
      title,
      presenter,
      publicationDate,
      description,
      status,
      videoMediaId,
      thumbnailMediaId,
    } = req.body;

    if (
      (title !== undefined && !title.trim()) ||
      (description !== undefined && !description.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Video title and description cannot be empty.",
      });
    }

    if (status !== undefined && !validStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video status.",
      });
    }

    if (
      publicationDate !== undefined &&
      !validDate(publicationDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid publication date.",
      });
    }

    let validatedVideoMediaId;

    if (videoMediaId !== undefined) {
      const videoValidation = await validateVideoMedia(videoMediaId);

      if (!videoValidation.valid) {
        return res.status(400).json({
          success: false,
          message: videoValidation.message,
        });
      }

      validatedVideoMediaId = videoValidation.media.id;
    }

    let validatedThumbnailMediaId;

    if (thumbnailMediaId !== undefined) {
      const thumbnailValidation = await validateThumbnailMedia(
        thumbnailMediaId
      );

      if (!thumbnailValidation.valid) {
        return res.status(400).json({
          success: false,
          message: thumbnailValidation.message,
        });
      }

      validatedThumbnailMediaId = thumbnailValidation.id;
    }

    const slug = title
      ? await generateSlug(title, id)
      : existing.slug;

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(title !== undefined && {
          title: title.trim(),
          slug,
        }),
        ...(presenter !== undefined && {
          presenter: presenter?.trim() || null,
        }),
        ...(publicationDate !== undefined && {
          publicationDate: publicationDate
            ? new Date(publicationDate)
            : null,
        }),
        ...(description !== undefined && {
          description: description.trim(),
        }),
        ...(status !== undefined && { status }),
        ...(validatedVideoMediaId !== undefined && {
          videoMediaId: validatedVideoMediaId,
        }),
        ...(thumbnailMediaId !== undefined && {
          thumbnailMediaId: validatedThumbnailMediaId,
        }),
      },
      include: videoIncludes,
    });

    return res.status(200).json({
      success: true,
      message: "Video updated successfully.",
      video,
    });
  } catch (error) {
    console.error("Update video error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update video.",
    });
  }
};

// VNS 12: DELETE VIDEO (ADMIN)
// This deletes the database record, not the uploaded Cloudinary files.
export const deleteVideo = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID.",
      });
    }

    const existing = await prisma.video.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    await prisma.video.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully.",
    });
  } catch (error) {
    console.error("Delete video error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete video.",
    });
  }
};
