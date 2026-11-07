
import prisma from "../lib/prisma.js";

// GET DASHBOARD STATISTICS (ADMIN)
export const getDashboardStats = async (req, res) => {
  try {
    // Retrieve all dashboard figures concurrently.
    const [
      researchReports,
      publishedResearchReports,
      draftResearchReports,
      publishedArticles,
      draftArticles,
      publishedVideos,
      draftVideos,
      mediaAssets,
      messagesReceived,
      unreadMessages,
    ] = await Promise.all([
      prisma.researchReport.count(),

      prisma.researchReport.count({
        where: { status: "Published" },
      }),

      prisma.researchReport.count({
        where: { status: "Draft" },
      }),

      prisma.article.count({
        where: { status: "Published" },
      }),

      prisma.article.count({
        where: { status: "Draft" },
      }),

      prisma.video.count({
        where: { status: "Published" },
      }),

      prisma.video.count({
        where: { status: "Draft" },
      }),

      prisma.mediaAsset.count(),

      prisma.contactMessage.count(),

      prisma.contactMessage.count({
        where: { status: "Unread" },
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        researchReports,
        publishedResearchReports,
        draftResearchReports,
        publishedArticles,
        draftArticles,
        publishedVideos,
        draftVideos,
        mediaAssets,
        messagesReceived,
        unreadMessages,
      },
    });
  } catch (error) {
    console.error("Get dashboard statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve dashboard statistics.",
    });
  }
};
