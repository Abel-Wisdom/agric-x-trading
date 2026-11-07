
import prisma from "../lib/prisma.js";

// VNS 1: SHARED REPORT DATA
const researchInclude = {
  coverMedia: true,
  pdfMedia: true,
  researchMedia: {
    include: {
      mediaAsset: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
};

// VNS 2: GENERATE A UNIQUE URL SLUG
const generateSlug = async (title, excludeId = null) => {
  const baseSlug =
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "research-report";

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.researchReport.findUnique({
      where: { slug },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// VNS 3: VALIDATE RESEARCH STATUS
const validStatus = (status) => {
  return ["Draft", "Published"].includes(status);
};

// VNS 4: PARSE CONTENT MEDIA FROM THE REQUEST
const parseMediaItems = (value) => {
  if (value === undefined) return undefined;

  let items = value;

  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      throw new Error("Invalid research media data.");
    }
  }

  if (!Array.isArray(items)) {
    throw new Error("Research media must be an array.");
  }

  const seenIds = new Set();

  return items.map((item, index) => {
    const mediaAssetId = Number(item.mediaAssetId);
    const mediaType = item.mediaType;

    if (
      !Number.isInteger(mediaAssetId) ||
      mediaAssetId <= 0
    ) {
      throw new Error(`Invalid media ID at position ${index + 1}.`);
    }

    if (seenIds.has(mediaAssetId)) {
      throw new Error("A media file cannot be attached twice.");
    }

    seenIds.add(mediaAssetId);

    if (!["image", "video"].includes(mediaType)) {
      throw new Error(
        `Invalid media type at position ${index + 1}.`
      );
    }

    const sortOrder = Number(item.sortOrder ?? index);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new Error(
        `Invalid media order at position ${index + 1}.`
      );
    }

    return {
      mediaAssetId,
      mediaType,
      caption:
        typeof item.caption === "string"
          ? item.caption.trim() || null
          : null,
      sortOrder,
    };
  });
};

// VNS 5: VERIFY CONTENT MEDIA EXISTS AND MATCHES ITS TYPE
const validateMediaItems = async (db, items) => {
  if (!items || items.length === 0) return [];

  const ids = items.map((item) => item.mediaAssetId);

  const assets = await db.mediaAsset.findMany({
    where: {
      id: { in: ids },
    },
  });

  if (assets.length !== ids.length) {
    throw new Error("One or more selected media files do not exist.");
  }

  const assetMap = new Map(
    assets.map((asset) => [asset.id, asset])
  );

  for (const item of items) {
    const asset = assetMap.get(item.mediaAssetId);

    if (item.mediaType === "image" && !asset.mimeType.startsWith("image/")) {
      throw new Error("An image entry must reference an image file.");
    }

    if (item.mediaType === "video" && !asset.mimeType.startsWith("video/")) {
      throw new Error("A video entry must reference a video file.");
    }
  }

  return items;
};

// VNS 6: VALIDATE COVER IMAGE AND OPTIONAL PDF
const validateReportFiles = async (
  db,
  coverMediaId,
  pdfMediaId
) => {
  const coverId = Number(coverMediaId);

  if (!Number.isInteger(coverId) || coverId <= 0) {
    throw new Error("A cover image is required for every research report.");
  }

  const cover = await db.mediaAsset.findUnique({
    where: { id: coverId },
  });

  if (!cover || !cover.mimeType.startsWith("image/")) {
    throw new Error("Please provide a valid cover image.");
  }

  let pdfId = null;

  if (pdfMediaId !== undefined && pdfMediaId !== null && pdfMediaId !== "") {
    pdfId = Number(pdfMediaId);

    if (!Number.isInteger(pdfId) || pdfId <= 0) {
      throw new Error("Invalid PDF media selection.");
    }

    const pdf = await db.mediaAsset.findUnique({
      where: { id: pdfId },
    });

    if (!pdf || pdf.mimeType !== "application/pdf") {
      throw new Error("Please provide a valid PDF document.");
    }
  }

  return {
    coverMediaId: coverId,
    pdfMediaId: pdfId,
  };
};

// VNS 7: GET ALL PUBLISHED RESEARCH REPORTS (PUBLIC)
export const getPublishedResearch = async (req, res) => {
  try {
    const reports = await prisma.researchReport.findMany({
      where: { status: "Published" },
      include: researchInclude,
      orderBy: { publicationDate: "desc" },
    });

    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Get published research error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve research reports.",
    });
  }
};

// VNS 8: GET ONE PUBLISHED REPORT (PUBLIC)
export const getResearchBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const report = await prisma.researchReport.findFirst({
      where: {
        slug,
        status: "Published",
      },
      include: researchInclude,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Research report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Get research report error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve this research report.",
    });
  }
};

// VNS 9: GET ALL REPORTS (ADMIN)
export const getAllResearch = async (req, res) => {
  try {
    const reports = await prisma.researchReport.findMany({
      include: researchInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Get all research error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve research reports.",
    });
  }
};

// VNS 10: CREATE A RESEARCH REPORT (ADMIN)
export const createResearch = async (req, res) => {
  try {
    const {
      title,
      category,
      location,
      publicationDate,
      description,
      content,
      status,
      coverMediaId,
      pdfMediaId,
    } = req.body;

    if (
      !title?.trim() ||
      !category?.trim() ||
      !description?.trim() ||
      !content?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, category, description and content are required.",
      });
    }

    const reportStatus = status || "Draft";

    if (!validStatus(reportStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid research report status.",
      });
    }

    const mediaItems = parseMediaItems(req.body.mediaItems);

    const slug = await generateSlug(title);

    // VNS 10A: SAVE REPORT AND MEDIA RELATIONSHIPS TOGETHER
    const report = await prisma.$transaction(async (tx) => {
      const files = await validateReportFiles(
        tx,
        coverMediaId,
        pdfMediaId
      );

      const validItems = await validateMediaItems(tx, mediaItems || []);

      const created = await tx.researchReport.create({
        data: {
          title: title.trim(),
          slug,
          category: category.trim(),
          location: location?.trim() || null,
          publicationDate: publicationDate
            ? new Date(publicationDate)
            : null,
          description: description.trim(),
          content,
          status: reportStatus,
          coverMediaId: files.coverMediaId,
          pdfMediaId: files.pdfMediaId,
        },
      });

      if (validItems.length > 0) {
        await tx.researchMedia.createMany({
          data: validItems.map((item) => ({
            researchReportId: created.id,
            ...item,
          })),
        });
      }

      return tx.researchReport.findUnique({
        where: { id: created.id },
        include: researchInclude,
          }, {
      maxWait: 10000,
      timeout: 15000,
    });
    });

    return res.status(201).json({
      success: true,
      message: "Research report created successfully.",
      report,
    });
  } catch (error) {
    console.error("Create research error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create research report.",
    });
  }
};

// VNS 11: UPDATE A RESEARCH REPORT (ADMIN)
export const updateResearch = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid research report ID.",
      });
    }

    const existing = await prisma.researchReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Research report not found.",
      });
    }

    const {
      title,
      category,
      location,
      publicationDate,
      description,
      content,
      status,
      coverMediaId,
      pdfMediaId,
    } = req.body;

    if (status !== undefined && !validStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid research report status.",
      });
    }

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty.",
      });
    }

    if (category !== undefined && !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category cannot be empty.",
      });
    }

    if (description !== undefined && !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description cannot be empty.",
      });
    }

    if (content !== undefined && !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content cannot be empty.",
      });
    }

    if (
      publicationDate &&
      Number.isNaN(new Date(publicationDate).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid publication date.",
      });
    }

    const parsedMediaItems = parseMediaItems(req.body.mediaItems);

    const updatedCoverMediaId =
      coverMediaId !== undefined
        ? coverMediaId
        : existing.coverMediaId;

    const updatedPdfMediaId =
      pdfMediaId !== undefined
        ? pdfMediaId
        : existing.pdfMediaId;

    const slug = title
      ? await generateSlug(title, id)
      : existing.slug;

    // VNS 11A: UPDATE REPORT AND MEDIA RELATIONSHIPS TOGETHER
    const report = await prisma.$transaction(async (tx) => {
      const files = await validateReportFiles(
        tx,
        updatedCoverMediaId,
        updatedPdfMediaId
      );

      const validItems =
        parsedMediaItems !== undefined
          ? await validateMediaItems(tx, parsedMediaItems)
          : undefined;

      await tx.researchReport.update({
        where: { id },
        data: {
          ...(title !== undefined && {
            title: title.trim(),
            slug,
          }),
          ...(category !== undefined && {
            category: category.trim(),
          }),
          ...(location !== undefined && {
            location: location.trim() || null,
          }),
          ...(publicationDate !== undefined && {
            publicationDate: publicationDate
              ? new Date(publicationDate)
              : null,
          }),
          ...(description !== undefined && {
            description: description.trim(),
          }),
          ...(content !== undefined && { content }),
          ...(status !== undefined && { status }),
          coverMediaId: files.coverMediaId,
          pdfMediaId: files.pdfMediaId,
        },
      });

      // Only replace relationships when mediaItems was submitted.
      if (validItems !== undefined) {
        await tx.researchMedia.deleteMany({
          where: { researchReportId: id },
        });

        if (validItems.length > 0) {
          await tx.researchMedia.createMany({
            data: validItems.map((item) => ({
              researchReportId: id,
              ...item,
            })),
          });
        }
      }

      return tx.researchReport.findUnique({
        where: { id },
        include: researchInclude,
          }, {
      maxWait: 10000,
      timeout: 15000,
    });
    });

    return res.status(200).json({
      success: true,
      message: "Research report updated successfully.",
      report,
    });
  } catch (error) {
    console.error("Update research error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update research report.",
    });
  }
};

// VNS 12: DELETE A RESEARCH REPORT (ADMIN)
export const deleteResearch = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid research report ID.",
      });
    }

    const existing = await prisma.researchReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Research report not found.",
      });
    }

    await prisma.researchReport.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Research report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete research error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete research report.",
    });
  }
};
