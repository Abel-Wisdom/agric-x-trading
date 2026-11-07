// ========================================
// VNS 1: IMPORT DEPENDENCIES
// JWT verifies the authentication token.
// Prisma retrieves the authenticated admin.
// ========================================
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// ========================================
// VNS 2: AUTHENTICATION MIDDLEWARE
// Protects private API routes by checking
// whether the request contains a valid JWT.
// ========================================
const authMiddleware = async (req, res, next) => {
  try {
    // Read the Authorization header.
    const authHeader = req.headers.authorization;

    // Ensure the header contains a Bearer token.
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // Extract the token after the word "Bearer".
    const token = authHeader.split(" ")[1];

    // Verify the token using the application's secret.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the admin associated with the token.
    const admin = await prisma.admin.findUnique({
      where: {
        id: decoded.adminId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Reject the request if the admin no longer exists.
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    // Attach the authenticated admin to the request.
    // Controllers can now access req.admin.
    req.admin = admin;

    // Continue to the protected route.
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

export default authMiddleware;