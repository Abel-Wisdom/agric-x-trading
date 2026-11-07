
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  fetchAdminData,
  getAdminCache,
  invalidateAdminData,
  clearAdminDataCache,
} from "../services/adminDataCache";
import "../styles/AdminMedia.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "") + "/media";

const CACHE_KEY = "media";
const TOKEN_KEY = "agric_admin_token";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_FILES = 20;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
];

// VNS 1: DETERMINE MEDIA TYPE
const getMediaType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
};

// VNS 2: FORMAT FILE SIZE
const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// VNS 3: HANDLE EXPIRED ADMIN SESSION
const handleUnauthorized = () => {
  clearAdminDataCache();

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("agric_admin");

  window.location.replace("/admin/login");
};

// VNS 4: AUTHENTICATED API HEADERS
const getAuthHeaders = (token) => {
  if (!token) {
    handleUnauthorized();
    throw new Error("Your admin session has expired. Please log in.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

// VNS 5: FETCH MEDIA FROM BACKEND
const requestMedia = async (token) => {
  const response = await fetch(API_URL, {
    headers: getAuthHeaders(token),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
    throw new Error("Your admin session has expired. Please log in.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to load media files.");
  }

  return data.media || [];
};

// VNS 6: ADMIN MEDIA LIBRARY
export default function AdminMedia() {
  const [mediaItems, setMediaItems] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    return token ? getAdminCache(CACHE_KEY, token) ?? [] : [];
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    return Boolean(token) && getAdminCache(CACHE_KEY, token) === null;
  });

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);

  const [preview, setPreview] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  // VNS 7: LOAD MEDIA WITH SHARED ADMIN CACHE
  const loadMedia = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      const items = await fetchAdminData(
        CACHE_KEY,
        () => requestMedia(token),
        token
      );

      setMediaItems(items);
      setError("");
    } catch (err) {
      setError(
        err.message || "Unable to connect to the media server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // VNS 8: INITIAL MEDIA LOAD
  useEffect(() => {
    void Promise.resolve().then(() => loadMedia());
  }, [loadMedia]);

  // VNS 9: CLEAN UP PDF PREVIEW URL
  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  // VNS 10: UPLOAD IMAGE, VIDEO AND PDF FILES
  const handleFileSelection = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    event.target.value = "";

    if (selectedFiles.length === 0) return;

    setError("");
    setSuccess("");

    if (selectedFiles.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} files at once.`);
      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(
          `${file.name}: Unsupported file. Select an image, video or PDF document.`
        );
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: File exceeds the 100 MB limit.`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      const formData = new FormData();

      validFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Media upload failed.");
      }

      invalidateAdminData(CACHE_KEY, "dashboard");

      setSuccess(data.message || "Media uploaded successfully.");

      await loadMedia();
    } catch (err) {
      setError(err.message || "Unable to upload media files.");
    } finally {
      setUploading(false);
    }
  };

  // VNS 11: FILTER AND SEARCH MEDIA
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      const type = getMediaType(item.mimeType);

      const matchesFilter =
        activeFilter === "all" || type === activeFilter;

      const matchesSearch = (item.originalName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [mediaItems, activeFilter, searchTerm]);

  const imageCount = mediaItems.filter(
    (item) => getMediaType(item.mimeType) === "image"
  ).length;

  const videoCount = mediaItems.filter(
    (item) => getMediaType(item.mimeType) === "video"
  ).length;

  const pdfCount = mediaItems.filter(
    (item) => getMediaType(item.mimeType) === "pdf"
  ).length;

  // VNS 12: OPEN AUTHENTICATED PDF PREVIEW
  const handlePreview = async (item) => {
    setPreviewingId(item.id);
    setError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      const response = await fetch(
        `${API_URL}/${item.id}/preview`,
        {
          headers: getAuthHeaders(token),
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        let message = "Unable to preview this PDF document.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);

      setPreview({
        url: pdfUrl,
        name: item.originalName,
      });
    } catch (err) {
      setError(err.message || "Unable to preview this PDF document.");
    } finally {
      setPreviewingId(null);
    }
  };

  // VNS 13: CLOSE PDF PREVIEW
  const closePreview = () => {
    setPreview(null);
  };

  // VNS 14: DELETE PERMANENT MEDIA
  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Permanently delete "${item.originalName}" from the media library?`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      const response = await fetch(`${API_URL}/${item.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete media file.");
      }

      invalidateAdminData(CACHE_KEY, "dashboard");

      setMediaItems((currentItems) =>
        currentItems.filter((media) => media.id !== item.id)
      );

      setSuccess(data.message || "Media file deleted successfully.");

      await loadMedia();
    } catch (err) {
      setError(err.message || "Unable to delete media file.");
    } finally {
      setDeletingId(null);
    }
  };

  // VNS 15: RENDER MEDIA LIBRARY
  return (
    <div className="admin-media-page">
      {/* PAGE HEADER */}
      <div className="admin-media-header">
        <div>
          <span className="admin-section-eyebrow">
            CONTENT MANAGEMENT
          </span>

          <h1>Media Library</h1>

          <p>
            Manage the images, videos and PDF documents used across the
            Agric X Trading website.
          </p>
        </div>

        <button
          type="button"
          className="admin-media-upload-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <span>↑</span>
          {uploading ? "Uploading..." : "Upload Media"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.pdf,application/pdf"
          multiple
          hidden
          onChange={handleFileSelection}
        />
      </div>

      {/* UPLOAD STATUS */}
      {uploading && (
        <div className="admin-media-notice">
          <div>
            <strong>Uploading files</strong>
            <p>
              Your files are being uploaded to permanent cloud storage.
              Please keep this page open.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="admin-media-notice admin-media-error" role="alert">
          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="admin-media-notice admin-media-success" role="status">
          <div>
            <strong>Success</strong>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* MEDIA STATISTICS */}
      <div className="admin-media-stats">
        <div className="admin-media-stat-card">
          <div className="admin-media-stat-icon">▣</div>
          <div>
            <span>Total Media</span>
            <strong>{mediaItems.length}</strong>
          </div>
        </div>

        <div className="admin-media-stat-card">
          <div className="admin-media-stat-icon">▧</div>
          <div>
            <span>Images</span>
            <strong>{imageCount}</strong>
          </div>
        </div>

        <div className="admin-media-stat-card">
          <div className="admin-media-stat-icon">▶</div>
          <div>
            <span>Videos</span>
            <strong>{videoCount}</strong>
          </div>
        </div>

        <div className="admin-media-stat-card">
          <div className="admin-media-stat-icon">PDF</div>
          <div>
            <span>PDF Documents</span>
            <strong>{pdfCount}</strong>
          </div>
        </div>
      </div>

      {/* MEDIA LIBRARY PANEL */}
      <section className="admin-media-library-panel">
        <div className="admin-media-library-heading">
          <div>
            <h2>Your Media</h2>
            <p>Browse and manage your permanently stored files.</p>
          </div>

          <span className="admin-media-total">
            {filteredMedia.length}{" "}
            {filteredMedia.length === 1 ? "file" : "files"}
          </span>
        </div>

        {/* FILTERS AND SEARCH */}
        <div className="admin-media-toolbar">
          <div className="admin-media-filters">
            {[
              { label: "All Files", value: "all" },
              { label: "Images", value: "image" },
              { label: "Videos", value: "video" },
              { label: "PDFs", value: "pdf" },
            ].map((filter) => (
              <button
                type="button"
                key={filter.value}
                className={
                  activeFilter === filter.value
                    ? "admin-media-filter active"
                    : "admin-media-filter"
                }
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="admin-media-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {/* MEDIA GRID */}
        {loading ? (
          <div className="admin-media-empty-state">
            <h3>Loading media library...</h3>
            <p>Retrieving your permanently stored files.</p>
          </div>
        ) : filteredMedia.length > 0 ? (
          <div className="admin-media-grid">
            {filteredMedia.map((item) => {
              const type = getMediaType(item.mimeType);

              return (
                <article className="admin-media-card" key={item.id}>
                  <div className="admin-media-preview">
                    {type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.altText || item.originalName}
                        loading="lazy"
                      />
                    ) : type === "video" ? (
                      <video
                        src={item.url}
                        controls
                        preload="metadata"
                      />
                    ) : type === "pdf" ? (
                      <div className="admin-media-pdf-preview">
                        <span className="admin-media-pdf-icon">📄</span>
                        <strong>PDF Document</strong>
                        <button
                          type="button"
                          onClick={() => handlePreview(item)}
                          disabled={previewingId === item.id}
                        >
                          {previewingId === item.id
                            ? "Loading PDF..."
                            : "Preview PDF ↗"}
                        </button>
                      </div>
                    ) : (
                      <div className="admin-media-pdf-preview">
                        <strong>Unsupported media type</strong>
                      </div>
                    )}

                    <span className="admin-media-type">
                      {type.toUpperCase()}
                    </span>
                  </div>

                  <div className="admin-media-card-details">
                    <strong title={item.originalName}>
                      {item.originalName}
                    </strong>

                    <div className="admin-media-file-info">
                      <span>{formatFileSize(item.size)}</span>
                      <span>{item.mimeType}</span>
                    </div>

                    <button
                      type="button"
                      className="admin-media-delete-button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item)}
                    >
                      <span>×</span>
                      {deletingId === item.id ? "Deleting..." : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="admin-media-empty-state">
            <div className="admin-media-empty-icon">▣</div>

            <h3>
              {mediaItems.length === 0
                ? "Your media library is empty"
                : "No matching files found"}
            </h3>

            <p>
              {mediaItems.length === 0
                ? "Upload images, videos or PDF documents to get started."
                : "Try another search term or select a different filter."}
            </p>

            {mediaItems.length === 0 && (
              <button
                type="button"
                className="admin-media-upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                ↑ Upload Your First File
              </button>
            )}
          </div>
        )}
      </section>

      {/* UPLOAD GUIDELINES */}
      <div className="admin-media-guidelines">
        <h3>Upload guidelines</h3>

        <div>
          <span>Images</span>
          <p>JPEG, PNG, WebP and GIF · Maximum 100 MB per file</p>
        </div>

        <div>
          <span>Videos</span>
          <p>MP4, WebM and MOV · Maximum 100 MB per file</p>
        </div>

        <div>
          <span>Documents</span>
          <p>PDF · Maximum 100 MB per file</p>
        </div>

        <p className="admin-media-guideline-footnote">
          Maximum 20 files per upload. Images, videos and PDF documents are
          stored permanently in Cloudinary, with their records saved in the
          database.
        </p>
      </div>

      {/* AUTHENTICATED PDF PREVIEW MODAL */}
      {preview && (
        <div
          role="presentation"
          onClick={closePreview}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`PDF preview: ${preview.name}`}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(1100px, 100%)",
              height: "min(850px, 92vh)",
              background: "#fff",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                minHeight: "58px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <strong
                style={{
                  color: "#234b32",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {preview.name}
              </strong>

              <button
                type="button"
                onClick={closePreview}
                aria-label="Close PDF preview"
                style={{
                  border: "none",
                  background: "#edf2ed",
                  color: "#234b32",
                  borderRadius: "6px",
                  padding: "8px 13px",
                  cursor: "pointer",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                Close ×
              </button>
            </div>

            <iframe
              src={preview.url}
              title={`PDF preview: ${preview.name}`}
              style={{
                width: "100%",
                flex: 1,
                border: "none",
                background: "#f4f4f4",
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}
