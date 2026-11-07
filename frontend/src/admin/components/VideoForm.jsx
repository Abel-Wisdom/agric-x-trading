
import { useEffect, useState } from "react";
import { clearAdminDataCache } from "../services/adminDataCache";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "");

const TOKEN_KEY = "agric_admin_token";
const ADMIN_KEY = "agric_admin";

// Handle expired or unauthorized administrator sessions.
function handleUnauthorized() {
  clearAdminDataCache();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  window.location.replace("/admin/login");
}

// Parse API responses and handle authentication errors consistently.
async function readResponse(response, fallbackMessage) {
  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
    throw new Error(
      "Your admin session has expired. Please log in again."
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

const getDateValue = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toISOString().slice(0, 10);
};

const VideoForm = ({
  initialVideo = null,
  onSaved,
  onCancel,
}) => {
  const isEditing = Boolean(initialVideo);

  const [form, setForm] = useState({
    title: initialVideo?.title || "",
    presenter: initialVideo?.presenter || "",
    publicationDate: getDateValue(initialVideo?.publicationDate),
    description: initialVideo?.description || "",
    status: initialVideo?.status || "Draft",
  });

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);

  const [videoPreview, setVideoPreview] = useState(
    initialVideo?.videoMedia?.url || ""
  );

  const [thumbnailPreview, setThumbnailPreview] = useState(
    initialVideo?.thumbnailMedia?.url || ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // RELEASE TEMPORARY FILE PREVIEWS
  useEffect(() => {
    return () => {
      if (videoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(videoPreview);
      }

      if (thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [videoPreview, thumbnailPreview]);

  // UPDATE TEXT FIELDS
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // SELECT VIDEO FILE
  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose an MP4, WebM, or MOV video file.");
      event.target.value = "";
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("The video file must not exceed 100 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  // SELECT OPTIONAL THUMBNAIL
  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, WebP, or GIF thumbnail.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The thumbnail must not exceed 10 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setRemoveThumbnail(false);
  };

  // UPLOAD ONE MEDIA FILE
  const uploadMedia = async (file, token) => {
    if (!token) {
      handleUnauthorized();
      throw new Error("Your session has expired. Please log in again.");
    }

    const data = new FormData();
    data.append("files", file);

    const response = await fetch(`${API_URL}/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });

    const result = await readResponse(
      response,
      "Media upload failed."
    );

    const uploadedMedia = result.media?.[0];

    if (!uploadedMedia?.id) {
      throw new Error("The uploaded media record was not returned.");
    }

    return uploadedMedia;
  };

  // SAVE VIDEO RECORD
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim()) {
      setError("Please provide a video title and description.");
      return;
    }

    if (!isEditing && !videoFile) {
      setError("Please select the video file you want to upload.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        handleUnauthorized();
        throw new Error("Your session has expired. Please log in again.");
      }

      const payload = {
        title: form.title.trim(),
        presenter: form.presenter.trim(),
        publicationDate: form.publicationDate,
        description: form.description.trim(),
        status: form.status,
      };

      if (videoFile) {
        const uploadedVideo = await uploadMedia(videoFile, token);
        payload.videoMediaId = uploadedVideo.id;
      }

      if (thumbnailFile) {
        const uploadedThumbnail = await uploadMedia(
          thumbnailFile,
          token
        );

        payload.thumbnailMediaId = uploadedThumbnail.id;
      } else if (removeThumbnail) {
        payload.thumbnailMediaId = null;
      }

      const endpoint = isEditing
        ? `${API_URL}/videos/${initialVideo.id}`
        : `${API_URL}/videos`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      await readResponse(response, "Unable to save video.");

      // Notify AdminInsights only after backend confirmation.
      onSaved?.(
        isEditing
          ? "Video updated successfully."
          : "Video uploaded successfully."
      );
    } catch (requestError) {
      setError(
        requestError.message || "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // VIDEO FORM
  return (
    <form className="admin-insights-form-card" onSubmit={handleSubmit}>
      <div className="admin-insights-form-heading">
        <h2>{isEditing ? "Edit Video" : "Upload New Video"}</h2>
        <p>
          Add a standalone video to the Agric X Trading video guides.
          This form is separate from the written article editor.
        </p>
      </div>

      <div className="admin-insights-form-grid">
        <div className="admin-insights-field admin-insights-full">
          <label htmlFor="video-title">Video Title *</label>
          <input
            id="video-title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter the video title"
            required
          />
        </div>

        <div className="admin-insights-field">
          <label htmlFor="video-presenter">Presenter / Author</label>
          <input
            id="video-presenter"
            name="presenter"
            type="text"
            value={form.presenter}
            onChange={handleChange}
            placeholder="Enter presenter name"
          />
        </div>

        <div className="admin-insights-field">
          <label htmlFor="video-date">Publication Date</label>
          <input
            id="video-date"
            name="publicationDate"
            type="date"
            value={form.publicationDate}
            onChange={handleChange}
          />
        </div>

        <div className="admin-insights-field admin-insights-full">
          <label htmlFor="video-description">Video Description *</label>
          <textarea
            id="video-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe what viewers will learn or see in this video..."
            rows={5}
            required
          />
        </div>

        <div className="admin-insights-field">
          <label htmlFor="video-file">
            Video File {isEditing ? "(Optional replacement)" : "*"}
          </label>
          <input
            id="video-file"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoChange}
            required={!isEditing}
          />
          <small>MP4, WebM or MOV. Maximum size: 100 MB.</small>

          {videoPreview && (
            <video
              className="admin-video-preview"
              src={videoPreview}
              controls
              preload="metadata"
            />
          )}
        </div>

        <div className="admin-insights-field">
          <label htmlFor="video-thumbnail">Thumbnail Image (Optional)</label>
          <input
            id="video-thumbnail"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleThumbnailChange}
          />
          <small>JPG, PNG, WebP or GIF. Maximum size: 10 MB.</small>

          {thumbnailPreview && !removeThumbnail && (
            <img
              className="admin-video-thumbnail-preview"
              src={thumbnailPreview}
              alt="Video thumbnail preview"
            />
          )}

          {isEditing && initialVideo?.thumbnailMedia && !thumbnailFile && (
            <label className="admin-video-remove-thumbnail">
              <input
                type="checkbox"
                checked={removeThumbnail}
                onChange={(event) => {
                  setRemoveThumbnail(event.target.checked);

                  if (event.target.checked) {
                    setThumbnailPreview("");
                  } else {
                    setThumbnailPreview(
                      initialVideo.thumbnailMedia?.url || ""
                    );
                  }
                }}
              />
              Remove existing thumbnail
            </label>
          )}
        </div>

        <div className="admin-insights-field">
          <label htmlFor="video-status">Publication Status</label>
          <select
            id="video-status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="admin-insights-form-notice admin-video-error">
          {error}
        </div>
      )}

      <div className="admin-insights-form-actions">
        <button
          type="button"
          className="admin-insights-cancel-btn"
          onClick={onCancel}
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
            ? "Saving..."
            : isEditing
              ? "Save Video Changes"
              : "Upload Video"}
        </button>
      </div>
    </form>
  );
};

export default VideoForm;
