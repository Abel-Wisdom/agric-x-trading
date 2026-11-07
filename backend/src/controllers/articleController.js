
import prisma from "../lib/prisma.js";

// VNS 1: GENERATE UNIQUE ARTICLE SLUG
const generateSlug = async (title, excludeId = null) => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.article.findUnique({
      where: { slug },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// VNS 2: VALIDATE ARTICLE STATUS
const validStatus = (status) => {
  return ["Draft", "Published"].includes(status);
};

// VNS 3: GET PUBLISHED ARTICLES (PUBLIC)
export const getPublishedArticles = async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: { status: "Published" },
      include: { coverMedia: true },
      orderBy: { publicationDate: "desc" },
    });

    return res.status(200).json({
      success: true,
      articles,
    });
  } catch (error) {
    console.error("Get published articles error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve articles.",
    });
  }
};

// VNS 4: GET ONE PUBLISHED ARTICLE (PUBLIC)
export const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await prisma.article.findFirst({
      where: {
        slug,
        status: "Published",
      },
      include: { coverMedia: true },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error("Get article error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve this article.",
    });
  }
};

// VNS 5: GET ALL ARTICLES (ADMIN)
export const getAllArticles = async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      include: { coverMedia: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      articles,
    });
  } catch (error) {
    console.error("Get all articles error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve articles.",
    });
  }
};

// VNS 6: CREATE ARTICLE (ADMIN)
export const createArticle = async (req, res) => {
  try {
    const {
      title,
      category,
      author,
      publicationDate,
      excerpt,
      content,
      status,
      coverMediaId,
    } = req.body;

    if (
      !title?.trim() ||
      !category?.trim() ||
      !author?.trim() ||
      !excerpt?.trim() ||
      !content?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, category, author, excerpt and content are required.",
      });
    }

    const articleStatus = status || "Draft";

    if (!validStatus(articleStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article status.",
      });
    }

    const slug = await generateSlug(title);

    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        slug,
        category: category.trim(),
        author: author.trim(),
        publicationDate: publicationDate
          ? new Date(publicationDate)
          : null,
        excerpt: excerpt.trim(),
        content,
        status: articleStatus,
        coverMediaId: coverMediaId
          ? Number(coverMediaId)
          : null,
      },
      include: { coverMedia: true },
    });

    return res.status(201).json({
      success: true,
      message: "Article created successfully.",
      article,
    });
  } catch (error) {
    console.error("Create article error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create article.",
    });
  }
};

// VNS 7: UPDATE ARTICLE (ADMIN)
export const updateArticle = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID.",
      });
    }

    const existing = await prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    const {
      title,
      category,
      author,
      publicationDate,
      excerpt,
      content,
      status,
      coverMediaId,
    } = req.body;

    if (status !== undefined && !validStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article status.",
      });
    }

    if (
      (title !== undefined && !title.trim()) ||
      (category !== undefined && !category.trim()) ||
      (author !== undefined && !author.trim()) ||
      (excerpt !== undefined && !excerpt.trim()) ||
      (content !== undefined && !content.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Text fields cannot be empty.",
      });
    }

    const slug = title
      ? await generateSlug(title, id)
      : existing.slug;

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(title !== undefined && {
          title: title.trim(),
          slug,
        }),
        ...(category !== undefined && {
          category: category.trim(),
        }),
        ...(author !== undefined && {
          author: author.trim(),
        }),
        ...(publicationDate !== undefined && {
          publicationDate: publicationDate
            ? new Date(publicationDate)
            : null,
        }),
        ...(excerpt !== undefined && {
          excerpt: excerpt.trim(),
        }),
        ...(content !== undefined && { content }),
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
      message: "Article updated successfully.",
      article,
    });
  } catch (error) {
    console.error("Update article error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update article.",
    });
  }
};

// VNS 8: DELETE ARTICLE (ADMIN)
export const deleteArticle = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID.",
      });
    }

    const existing = await prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    await prisma.article.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Article deleted successfully.",
    });
  } catch (error) {
    console.error("Delete article error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete article.",
    });
  }
};
