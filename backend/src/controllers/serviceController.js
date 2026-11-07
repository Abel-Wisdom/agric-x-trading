
import prisma from "../lib/prisma.js";

// VNS 1: VALIDATE SERVICE STATUS
const validStatus = (status) => {
  return ["Draft", "Published"].includes(status);
};

// VNS 2: GET PUBLISHED SERVICES (PUBLIC)
export const getPublishedServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { status: "Published" },
      include: { coverMedia: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get published services error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve services.",
    });
  }
};

// VNS 3: GET ALL SERVICES (ADMIN)
export const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: { coverMedia: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get all services error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve services.",
    });
  }
};

// VNS 4: CREATE SERVICE (ADMIN)
export const createService = async (req, res) => {
  try {
    const {
      title,
      category,
      shortDescription,
      description,
      status,
      coverMediaId,
    } = req.body;

    if (
      !title?.trim() ||
      !category?.trim() ||
      !shortDescription?.trim() ||
      !description?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, category and descriptions are required.",
      });
    }

    const serviceStatus = status || "Draft";

    if (!validStatus(serviceStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service status.",
      });
    }

    const service = await prisma.service.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        status: serviceStatus,
        coverMediaId: coverMediaId
          ? Number(coverMediaId)
          : null,
      },
      include: { coverMedia: true },
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create service.",
    });
  }
};

// VNS 5: UPDATE SERVICE (ADMIN)
export const updateService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const existing = await prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const {
      title,
      category,
      shortDescription,
      description,
      status,
      coverMediaId,
    } = req.body;

    if (status !== undefined && !validStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service status.",
      });
    }

    if (
      (title !== undefined && !title.trim()) ||
      (category !== undefined && !category.trim()) ||
      (shortDescription !== undefined && !shortDescription.trim()) ||
      (description !== undefined && !description.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Text fields cannot be empty.",
      });
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(shortDescription !== undefined && {
          shortDescription: shortDescription.trim(),
        }),
        ...(description !== undefined && {
          description: description.trim(),
        }),
        ...(status !== undefined && { status }),
        ...(coverMediaId !== undefined && {
          coverMediaId: coverMediaId
            ? Number(coverMediaId)
            : null,
        }),
      },
      include: { coverMedia: true },
    });

    return res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update service.",
    });
  }
};

// VNS 6: DELETE SERVICE (ADMIN)
export const deleteService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const existing = await prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    await prisma.service.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete service.",
    });
  }
};
