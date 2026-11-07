
import { useCallback, useEffect, useState } from "react";
import ResearchEditor from "../components/ResearchEditor";
import {
  fetchAdminData,
  getAdminCache,
  invalidateAdminData,
  clearAdminDataCache,
} from "../services/adminDataCache";
import { invalidatePublicData } from "../../services/publicDataCache";
import "../styles/AdminResearch.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "");

const CACHE_KEY = "research";

const emptyForm = {
  title: "",
  category: "",
  location: "",
  publicationDate: "",
  description: "",
  content: "",
  status: "Draft",
};

export default function AdminResearch() {
  const [reports, setReports] = useState(() => {
    const token = localStorage.getItem("agric_admin_token");

    return token ? getAdminCache(CACHE_KEY, token) ?? [] : [];
  });

  const [form, setForm] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem("agric_admin_token");

    return Boolean(token) && getAdminCache(CACHE_KEY, token) === null;
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // VNS 1: AUTHENTICATION HELPERS
  const getToken = () => localStorage.getItem("agric_admin_token");

  const handleUnauthorized = () => {
    clearAdminDataCache();

    localStorage.removeItem("agric_admin_token");
    localStorage.removeItem("agric_admin");

    window.location.replace("/admin/login");
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // VNS 2: LOAD RESEARCH REPORTS THROUGH THE SHARED CACHE
  const loadReports = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const result = await fetchAdminData(
        CACHE_KEY,
        async () => {
          const response = await fetch(`${API_URL}/research`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            throw new Error("Your session has expired.");
          }

          if (!response.ok || !data.success) {
            throw new Error(
              data.message || "Unable to load research reports."
            );
          }

          return data.reports || [];
        },
        token
      );

      setReports(result);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // VNS 3: DISPLAY CACHED DATA IMMEDIATELY, THEN REFRESH
  useEffect(() => {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    void Promise.resolve().then(() => loadReports());
  }, [loadReports]);

  // VNS 4: UPDATE FORM FIELDS
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // VNS 5: RESET THE FORM
  const resetForm = () => {
    setForm(emptyForm);
    setCoverFile(null);
    setPdfFile(null);
    setMediaItems([]);
    setEditingId(null);
    setShowForm(false);

    const coverInput = document.getElementById("research-cover");
    const pdfInput = document.getElementById("research-pdf");

    if (coverInput) coverInput.value = "";
    if (pdfInput) pdfInput.value = "";
  };

  // VNS 6: OPEN THE FORM FOR A NEW REPORT
  const openNewForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // VNS 7: OPEN AN EXISTING REPORT FOR EDITING
  const openEditForm = (report) => {
    setForm({
      title: report.title || "",
      category: report.category || "",
      location: report.location || "",
      publicationDate: report.publicationDate
        ? new Date(report.publicationDate).toISOString().slice(0, 10)
        : "",
      description: report.description || "",
      content: report.content || "",
      status: report.status || "Draft",
    });

    setMediaItems(
      (report.researchMedia || []).map((item) => ({
        mediaAssetId: item.mediaAssetId,
        mediaType: item.mediaType,
        caption: item.caption || "",
        sortOrder: item.sortOrder || 0,
      }))
    );

    setCoverFile(null);
    setPdfFile(null);
    setEditingId(report.id);
    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // VNS 8: RECEIVE MEDIA RELATIONSHIPS FROM THE RESEARCH EDITOR
  const handleMediaChange = (items) => {
    setMediaItems(items || []);
  };

  // VNS 9: UPLOAD COVER IMAGE AND OPTIONAL PDF
  const uploadResearchFiles = async () => {
    if (!coverFile && !pdfFile) {
      return {};
    }

    const uploadData = new FormData();

    if (coverFile) uploadData.append("cover", coverFile);
    if (pdfFile) uploadData.append("pdf", pdfFile);

    const response = await fetch(`${API_URL}/research/upload-files`, {
      method: "POST",
      headers: authHeaders(),
      body: uploadData,
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Research file upload failed.");
    }

    return data;
  };

  // VNS 10: CREATE OR UPDATE A RESEARCH REPORT
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editingId && !coverFile) {
      setError("Please select a cover image for this report.");
      return;
    }

    if (!form.content.trim()) {
      setError("Please add the research report content.");
      return;
    }

    try {
      setSaving(true);

      const uploaded = await uploadResearchFiles();

      const existingReport = reports.find(
        (report) => report.id === editingId
      );

      const payload = {
        ...form,
        publicationDate: form.publicationDate || null,
        coverMediaId:
          uploaded.cover?.id ??
          existingReport?.coverMediaId ??
          null,
        pdfMediaId:
          uploaded.pdf?.id ??
          existingReport?.pdfMediaId ??
          null,
        mediaItems,
      };

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/research/${editingId}`
          : `${API_URL}/research`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save research report.");
      }

      // Refresh both admin and public data after a successful save.
      invalidateAdminData(CACHE_KEY, "dashboard");
      invalidatePublicData("research");

      setSuccess(data.message || "Research report saved successfully.");
      resetForm();
      await loadReports();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  // VNS 11: DELETE A RESEARCH REPORT
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this research report?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setDeletingId(id);

      const response = await fetch(`${API_URL}/research/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete report.");
      }

      invalidateAdminData(CACHE_KEY, "dashboard");
      invalidatePublicData("research");

      setSuccess("Research report deleted successfully.");
      await loadReports();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  };

  // VNS 12: RESEARCH MANAGEMENT INTERFACE
  return (
    <div className="admin-management-page admin-research-page">
      <div className="admin-management-header">
        <div>
          <span className="admin-section-eyebrow">
            CONTENT MANAGEMENT
          </span>
          <h2>Research &amp; Fieldwork</h2>
          <p>
            Manage agricultural research reports, field investigations
            and published documentation.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openNewForm}
        >
          + Add Research Report
        </button>
      </div>

      {error && (
        <div className="admin-research-alert admin-research-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-research-alert admin-research-success">
          {success}
        </div>
      )}

      {showForm && (
        <section className="admin-panel admin-content-form">
          <div className="admin-panel-heading">
            <h3>
              {editingId ? "Edit Research Report" : "Add Research Report"}
            </h3>
            <p>
              Add your report details, cover image and research content.
              A PDF document is optional.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="research-title">Report Title</label>
                <input
                  id="research-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter report title"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="research-category">Research Category</label>
                <select
                  id="research-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Soil Research">Soil Research</option>
                  <option value="Crop Research">Crop Research</option>
                  <option value="Agricultural Inputs">Agricultural Inputs</option>
                  <option value="Field Investigation">Field Investigation</option>
                  <option value="Farmer Training">Farmer Training</option>
                  <option value="Other Research">Other Research</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label htmlFor="research-location">Research Location</label>
                <input
                  id="research-location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Enter research location"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="research-date">Publication Date</label>
                <input
                  id="research-date"
                  type="date"
                  name="publicationDate"
                  value={form.publicationDate}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group admin-full-width">
                <label htmlFor="research-description">Short Description</label>
                <textarea
                  id="research-description"
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Provide a short summary of the research..."
                  required
                />
              </div>

              <div className="admin-form-group admin-full-width">
                <label>Research Content</label>
                <ResearchEditor
                  content={form.content}
                  onChange={(content) =>
                    setForm((current) => ({
                      ...current,
                      content,
                    }))
                  }
                  onMediaChange={handleMediaChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="research-cover">
                  Cover Image {!editingId && "(Required)"}
                </label>
                <input
                  id="research-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) =>
                    setCoverFile(event.target.files?.[0] || null)
                  }
                  required={!editingId}
                />
                {editingId && (
                  <small>
                    Leave empty to keep the existing cover image.
                  </small>
                )}
                {coverFile && <small>Selected: {coverFile.name}</small>}
              </div>

              <div className="admin-form-group">
                <label htmlFor="research-pdf">Research PDF (Optional)</label>
                <input
                  id="research-pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setPdfFile(event.target.files?.[0] || null)
                  }
                />
                <small>
                  You can publish the report without a PDF. Visitors will
                  read the written research content instead.
                </small>
                {pdfFile && <small>Selected: {pdfFile.name}</small>}
                {editingId && existingPdfMessage(reports, editingId)}
              </div>

              <div className="admin-form-group">
                <label htmlFor="research-status">Publication Status</label>
                <select
                  id="research-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Research Report"
                    : "Save Research Report"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-research-list">
        <div className="admin-panel-heading">
          <h3>Research Reports</h3>
          <p>{reports.length} report(s) in your library</p>
        </div>

        {loading ? (
          <div className="admin-panel admin-empty-state">
            <p>Loading research reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="admin-panel admin-empty-state">
            <div className="admin-empty-icon">◎</div>
            <h3>No Research Reports Yet</h3>
            <p>
              Add your first report with a cover image and written research
              content. A PDF is optional.
            </p>
            <button
              type="button"
              className="admin-primary-button"
              onClick={openNewForm}
            >
              Add First Report
            </button>
          </div>
        ) : (
          <div className="admin-research-grid">
            {reports.map((report) => (
              <article
                className="admin-panel admin-research-card"
                key={report.id}
              >
                {report.coverMedia?.url && (
                  <img
                    className="admin-research-cover"
                    src={report.coverMedia.url}
                    alt={report.title}
                  />
                )}

                <div className="admin-research-card-content">
                  <div className="admin-research-card-meta">
                    <span>{report.category}</span>
                    <span
                      className={
                        report.status === "Published"
                          ? "admin-research-status published"
                          : "admin-research-status draft"
                      }
                    >
                      {report.status}
                    </span>
                  </div>

                  <h3>{report.title}</h3>

                  <p>{report.description}</p>

                  <div className="admin-research-file-info">
                    <span>
                      Cover: {report.coverMedia ? "Attached" : "Missing"}
                    </span>
                    <span>
                      PDF: {report.pdfMedia ? "Attached" : "Not attached"}
                    </span>
                    <span>
                      Content media: {report.researchMedia?.length || 0}
                    </span>
                  </div>

                  <div className="admin-research-card-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => openEditForm(report)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => handleDelete(report.id)}
                      disabled={deletingId === report.id}
                    >
                      {deletingId === report.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// VNS 13: SHOW EXISTING PDF STATUS WHEN EDITING
function existingPdfMessage(reports, editingId) {
  const report = reports.find((item) => item.id === editingId);

  if (!report) return null;

  return (
    <small>
      {report.pdfMedia
        ? "A PDF is already attached. Leave this empty to keep it."
        : "No PDF is currently attached. You can add one, or leave it empty."}
    </small>
  );
}
