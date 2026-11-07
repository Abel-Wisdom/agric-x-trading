
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArticleEditor from "../components/ArticleEditor";
import VideoForm from "../components/VideoForm";
import {
  fetchAdminData,
  getAdminCache,
  invalidateAdminData,
  clearAdminDataCache,
} from "../services/adminDataCache";
import { invalidatePublicData } from "../../services/publicDataCache";
import "../styles/AdminInsights.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "");

const TOKEN_KEY = "agric_admin_token";

const ARTICLE_CACHE_KEY = "insights:articles";
const VIDEO_CACHE_KEY = "insights:videos";

const INITIAL_FORM = {
  title: "",
  category: "Articles",
  author: "",
  publicationDate: "",
  status: "Draft",
  excerpt: "",
  content: "",
};

export default function AdminInsights() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? getAdminCache(ARTICLE_CACHE_KEY, token) ?? [] : [];
  });

  const [videos, setVideos] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? getAdminCache(VIDEO_CACHE_KEY, token) ?? [] : [];
  });

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [existingCoverId, setExistingCoverId] = useState(null);

  const [activeForm, setActiveForm] = useState(null);
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) return true;

    return (
      getAdminCache(ARTICLE_CACHE_KEY, token) === null ||
      getAdminCache(VIDEO_CACHE_KEY, token) === null
    );
  });

  const [saving, setSaving] = useState(false);
  const [deletingArticleId, setDeletingArticleId] = useState(null);
  const [deletingVideoId, setDeletingVideoId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // VNS 1: CENTRALIZED SESSION EXPIRY HANDLING
  const handleUnauthorized = useCallback(() => {
    clearAdminDataCache();

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("agric_admin");

    navigate("/admin/login", { replace: true });
  }, [navigate]);

  // VNS 2: AUTHENTICATED API REQUEST
  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        handleUnauthorized();
        throw new Error("Your admin session has expired.");
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
          ...options.headers,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        throw new Error("Your admin session has expired. Please log in again.");
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Something went wrong. Please try again."
        );
      }

      return result;
    },
    [handleUnauthorized]
  );

  // VNS 3: LOAD ARTICLES AND VIDEOS WITH SHARED CACHING
  const loadContent = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      handleUnauthorized();
      setLoading(false);
      return;
    }

    try {
      const [articleResult, videoResult] = await Promise.all([
        fetchAdminData(
          ARTICLE_CACHE_KEY,
          async () => {
            const result = await apiRequest("/articles");

            return Array.isArray(result)
              ? result
              : result.articles || result.data || [];
          },
          token
        ),

        fetchAdminData(
          VIDEO_CACHE_KEY,
          async () => {
            const result = await apiRequest("/videos");

            return Array.isArray(result)
              ? result
              : result.videos || result.data || [];
          },
          token
        ),
      ]);

      setArticles(articleResult);
      setVideos(videoResult);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load content.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleUnauthorized]);

  useEffect(() => {
    let active = true;

    const loadInitialContent = async () => {
      await loadContent();

      if (!active) return;
    };

    loadInitialContent();

    return () => {
      active = false;
    };
  }, [loadContent]);

  // VNS 4: ARTICLE FIELD MANAGEMENT
  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // VNS 5: RESET ARTICLE FORM
  const resetArticleForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setCoverFile(null);
    setCoverPreview("");
    setExistingCoverId(null);
    setActiveForm(null);
    setError("");
  };

  // VNS 6: OPEN ARTICLE FORM
  const openCreateForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setCoverFile(null);
    setCoverPreview("");
    setExistingCoverId(null);
    setEditingVideo(null);
    setActiveForm("article");
    setError("");
    setSuccess("");
  };

  // VNS 7: OPEN VIDEO FORM
  const openVideoForm = () => {
    setEditingId(null);
    setEditingVideo(null);
    setActiveForm("video");
    setError("");
    setSuccess("");
  };

  // VNS 8: EDIT ARTICLE
  const handleEdit = (article) => {
    setEditingId(article.id);
    setEditingVideo(null);

    setForm({
      title: article.title || "",
      category: article.category || "Articles",
      author: article.author || "",
      publicationDate: article.publicationDate
        ? new Date(article.publicationDate).toISOString().slice(0, 10)
        : "",
      status: article.status || "Draft",
      excerpt: article.excerpt || "",
      content: article.content || "",
    });

    setExistingCoverId(
      article.coverMediaId || article.coverMedia?.id || null
    );

    setCoverFile(null);
    setCoverPreview(article.coverMedia?.url || "");
    setActiveForm("article");
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // VNS 9: SELECT ARTICLE COVER
  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError("");
  };

  // VNS 10: UPLOAD ARTICLE COVER
  const uploadCover = async () => {
    if (!coverFile) return null;

    const uploadData = new FormData();
    uploadData.append("files", coverFile);

    const result = await apiRequest("/media/upload", {
      method: "POST",
      body: uploadData,
    });

    const uploadedMedia = result.media?.[0];

    if (!uploadedMedia?.id || !uploadedMedia?.url) {
      throw new Error("The cover image upload did not return valid media.");
    }

    return uploadedMedia;
  };

  // VNS 11: SAVE ARTICLE
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !form.author.trim() ||
      !form.excerpt.trim() ||
      !form.content.trim()
    ) {
      setError("Please complete all required article fields.");
      return;
    }

    setSaving(true);

    try {
      let coverMediaId = existingCoverId;

      if (coverFile) {
        const uploadedCover = await uploadCover();
        coverMediaId = uploadedCover.id;
      }

      const payload = {
        title: form.title.trim(),
        category: form.category,
        author: form.author.trim(),
        publicationDate: form.publicationDate || null,
        status: form.status,
        excerpt: form.excerpt.trim(),
        content: form.content,
      };

      if (coverMediaId) {
        payload.coverMediaId = coverMediaId;
      }

      const endpoint = editingId
        ? `/articles/${editingId}`
        : "/articles";

      await apiRequest(endpoint, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      invalidateAdminData(ARTICLE_CACHE_KEY, "dashboard");
      invalidatePublicData("articles");

      const message = editingId
        ? "Article updated successfully."
        : "Article created successfully.";

      resetArticleForm();
      setSuccess(message);

      await loadContent();
    } catch (err) {
      setError(err.message || "Unable to save article.");
    } finally {
      setSaving(false);
    }
  };

  // VNS 12: DELETE ARTICLE
  const handleDeleteArticle = async (article) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${article.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingArticleId(article.id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/articles/${article.id}`, {
        method: "DELETE",
      });

      invalidateAdminData(ARTICLE_CACHE_KEY, "dashboard");
      invalidatePublicData("articles");

      if (editingId === article.id) {
        resetArticleForm();
      }

      setSuccess("Article deleted successfully.");

      await loadContent();
    } catch (err) {
      setError(err.message || "Unable to delete article.");
    } finally {
      setDeletingArticleId(null);
    }
  };

  // VNS 13: DELETE VIDEO
  const handleDeleteVideo = async (video) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${video.title}"? This removes the video record but does not automatically delete its uploaded media files.`
    );

    if (!confirmed) return;

    setDeletingVideoId(video.id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/videos/${video.id}`, {
        method: "DELETE",
      });

      invalidateAdminData(VIDEO_CACHE_KEY, "dashboard");
      invalidatePublicData("videos");

      if (editingVideo?.id === video.id) {
        setEditingVideo(null);
        setActiveForm(null);
      }

      setSuccess("Video record deleted successfully.");

      await loadContent();
    } catch (err) {
      setError(err.message || "Unable to delete video.");
    } finally {
      setDeletingVideoId(null);
    }
  };

  // VNS 14: VIDEO FORM CALLBACKS
  const handleVideoSaved = async (message) => {
    invalidateAdminData(VIDEO_CACHE_KEY, "dashboard");
    invalidatePublicData("videos");

    setActiveForm(null);
    setEditingVideo(null);
    setError("");
    setSuccess(message);

    await loadContent();
  };

  const handleVideoCancel = () => {
    setActiveForm(null);
    setEditingVideo(null);
    setError("");
  };

  // VNS 15: DATE FORMATTING
  const formatDate = (date) => {
    if (!date) return "Not scheduled";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // VNS 16: SHARED CONTENT STATUS
  const renderStatus = (status) => (
    <span
      style={{
        padding: "6px 11px",
        borderRadius: 20,
        background:
          status === "Published" ? "#edf5ef" : "#f5f1e7",
        color: status === "Published" ? "#286342" : "#80672f",
        fontSize: 10,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {status || "Draft"}
    </span>
  );

  // VNS 17: PAGE INTERFACE
  return (
    <section className="admin-insights-page">
      <div className="admin-insights-header">
        <div>
          <span className="admin-page-eyebrow">
            CONTENT MANAGEMENT
          </span>

          <h1>Insights & Articles</h1>

          <p>
            Create, manage, and publish agricultural articles,
            farming guides, and educational videos.
          </p>
        </div>

        {!activeForm && (
          <div className="admin-insights-header-actions">
            <button
              type="button"
              className="admin-insights-add-btn"
              onClick={openCreateForm}
            >
              + Write New Article
            </button>

            <button
              type="button"
              className="admin-insights-video-add-btn"
              onClick={openVideoForm}
            >
              + Upload New Video
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 18,
            padding: 13,
            borderRadius: 8,
            background: "#fff1ef",
            color: "#a13d32",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            marginBottom: 18,
            padding: 13,
            borderRadius: 8,
            background: "#edf5ef",
            color: "#286342",
            fontSize: 13,
          }}
        >
          {success}
        </div>
      )}

      {/* VNS 18: ARTICLE FORM */}
      {activeForm === "article" && (
        <div className="admin-insights-form-card">
          <div className="admin-insights-form-heading">
            <h2>
              {editingId ? "Edit Article" : "Create New Article"}
            </h2>

            <p>
              Add article details and prepare your content for publication.
            </p>
          </div>

          <form
            className="admin-insights-form"
            onSubmit={handleSubmit}
          >
            <div className="admin-insights-form-grid">
              <div className="admin-insights-field admin-insights-full">
                <label htmlFor="article-title">Article Title *</label>
                <input
                  id="article-title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleFieldChange}
                  placeholder="Enter article title"
                  required
                />
              </div>

              <div className="admin-insights-field">
                <label htmlFor="article-category">Category *</label>
                <select
                  id="article-category"
                  name="category"
                  value={form.category}
                  onChange={handleFieldChange}
                  required
                >
                  <option value="Articles">Articles</option>
                  <option value="Farming Guides">Farming Guides</option>
                </select>
              </div>

              <div className="admin-insights-field">
                <label htmlFor="article-author">Author *</label>
                <input
                  id="article-author"
                  name="author"
                  type="text"
                  value={form.author}
                  onChange={handleFieldChange}
                  placeholder="Enter author name"
                  required
                />
              </div>

              <div className="admin-insights-field">
                <label htmlFor="article-date">Publication Date</label>
                <input
                  id="article-date"
                  name="publicationDate"
                  type="date"
                  value={form.publicationDate}
                  onChange={handleFieldChange}
                />
              </div>

              <div className="admin-insights-field">
                <label htmlFor="article-status">Publication Status *</label>
                <select
                  id="article-status"
                  name="status"
                  value={form.status}
                  onChange={handleFieldChange}
                  required
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div className="admin-insights-field admin-insights-full">
                <label htmlFor="article-excerpt">
                  Short Description / Excerpt *
                </label>
                <textarea
                  id="article-excerpt"
                  name="excerpt"
                  rows="3"
                  value={form.excerpt}
                  onChange={handleFieldChange}
                  placeholder="Write a short introduction to the article..."
                  required
                />
              </div>

              <div className="admin-insights-field admin-insights-full">
                <label htmlFor="article-cover">Cover Image</label>
                <input
                  id="article-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverChange}
                />

                <small>
                  {editingId
                    ? "Choose a new image only if you want to replace the existing cover."
                    : "Upload an image to represent this article. A cover image is optional."}
                </small>

                {coverPreview && (
                  <div style={{ marginTop: 12 }}>
                    <img
                      src={coverPreview}
                      alt="Article cover preview"
                      style={{
                        display: "block",
                        width: "100%",
                        maxWidth: 320,
                        maxHeight: 190,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="admin-insights-field admin-insights-full">
                <label>Article Content *</label>
                <ArticleEditor
                  content={form.content}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      content: value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="admin-insights-form-notice">
              Article content and uploaded media are stored using the
              existing backend and Cloudinary media library. Draft
              articles remain private; published articles appear in
              the public Insights section.
            </div>

            <div className="admin-insights-form-actions">
              <button
                type="button"
                className="admin-insights-cancel-btn"
                onClick={resetArticleForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-insights-save-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving Article..."
                  : editingId
                    ? "Update Article"
                    : "Save Article"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VNS 19: VIDEO FORM */}
      {activeForm === "video" && (
        <VideoForm
          initialVideo={editingVideo}
          onSaved={handleVideoSaved}
          onCancel={handleVideoCancel}
        />
      )}

      {/* VNS 20: ARTICLE MANAGEMENT LIST */}
      <div className="admin-insights-list-card">
        <div className="admin-insights-list-heading">
          <div>
            <h2>Articles & Farming Guides</h2>
            <p>Manage written articles and educational guides.</p>
          </div>

          <span className="admin-insights-count">
            {articles.length} {articles.length === 1 ? "Article" : "Articles"}
          </span>
        </div>

        {loading ? (
          <div className="admin-insights-empty">
            <p>Loading content...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="admin-insights-empty">
            <div className="admin-insights-empty-icon">✎</div>
            <h3>No articles yet</h3>
            <p>
              Written articles and farming guides will appear here
              after you create them.
            </p>
            {!activeForm && (
              <button type="button" onClick={openCreateForm}>
                Write Your First Article
              </button>
            )}
          </div>
        ) : (
          <div className="admin-insights-content-list">
            {articles.map((article) => (
              <article className="admin-insights-content-item" key={article.id}>
                {article.coverMedia?.url && (
                  <img
                    className="admin-insights-item-image"
                    src={article.coverMedia.url}
                    alt={article.title}
                  />
                )}

                <div className="admin-insights-item-details">
                  <h3>{article.title}</h3>
                  <p>
                    {article.category} · By {article.author}
                  </p>
                  <small>{formatDate(article.publicationDate)}</small>
                </div>

                {renderStatus(article.status)}

                <div className="admin-insights-item-actions">
                  <button
                    type="button"
                    onClick={() => handleEdit(article)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-insights-delete-btn"
                    onClick={() => handleDeleteArticle(article)}
                    disabled={deletingArticleId === article.id}
                  >
                    {deletingArticleId === article.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* VNS 21: VIDEO MANAGEMENT LIST */}
      <div className="admin-insights-list-card">
        <div className="admin-insights-list-heading">
          <div>
            <h2>Video Guides</h2>
            <p>Manage standalone educational videos and field recordings.</p>
          </div>

          <span className="admin-insights-count">
            {videos.length} {videos.length === 1 ? "Video" : "Videos"}
          </span>
        </div>

        {loading ? (
          <div className="admin-insights-empty">
            <p>Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="admin-insights-empty">
            <div className="admin-insights-empty-icon">▶</div>
            <h3>No videos uploaded yet</h3>
            <p>
              Standalone video guides will appear here after you
              upload and save them.
            </p>
            {!activeForm && (
              <button type="button" onClick={openVideoForm}>
                Upload Your First Video
              </button>
            )}
          </div>
        ) : (
          <div className="admin-insights-content-list">
            {videos.map((video) => (
              <article className="admin-insights-content-item" key={video.id}>
                {video.thumbnailMedia?.url ? (
                  <img
                    className="admin-insights-item-image"
                    src={video.thumbnailMedia.url}
                    alt={video.title}
                  />
                ) : (
                  <div className="admin-insights-video-placeholder">
                    ▶
                  </div>
                )}

                <div className="admin-insights-item-details">
                  <h3>{video.title}</h3>
                  <p>
                    {video.presenter || "No presenter specified"}
                  </p>
                  <small>{formatDate(video.publicationDate)}</small>
                </div>

                {renderStatus(video.status)}

                <div className="admin-insights-item-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVideo(video);
                      setEditingId(null);
                      setActiveForm("video");
                      setError("");
                      setSuccess("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-insights-delete-btn"
                    onClick={() => handleDeleteVideo(video)}
                    disabled={deletingVideoId === video.id}
                  >
                    {deletingVideoId === video.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
