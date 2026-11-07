import prisma from "../lib/prisma.js";

// VNS 1: ALLOWED WEBSITE SETTINGS
const allowedFields = [
  "companyName",
  "email",
  "phone",
  "address",
  "aboutText",
];

// VNS 2: GET WEBSITE SETTINGS
export const getSettings = async (req, res) => {
  try {
    // Create default settings if they do not exist yet.
    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve website settings.",
    });
  }
};

// VNS 3: UPDATE WEBSITE SETTINGS
export const updateSettings = async (req, res) => {
  try {
    const updates = {};

    // Only accept the fields defined in our settings model.
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = req.body[field];

        if (typeof value !== "string" && value !== null) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a string or null.`,
          });
        }

        updates[field] =
          typeof value === "string" ? value.trim() || null : null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid settings were provided.",
      });
    }

    // Company name cannot be empty.
    if (
      Object.prototype.hasOwnProperty.call(updates, "companyName") &&
      !updates.companyName
    ) {
      return res.status(400).json({
        success: false,
        message: "Company name cannot be empty.",
      });
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: updates,
      create: {
        id: 1,
        ...updates,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Website settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update website settings.",
    });
  }
};