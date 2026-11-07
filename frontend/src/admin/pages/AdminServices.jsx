
import { useMemo, useState } from "react";
import "../styles/AdminServices.css";

// ========================================
// VNS 1: SERVICE CATEGORIES
// ========================================
const serviceCategories = [
  "Agricultural Research",
  "Agricultural Inputs Consultation",
  "Farmer Training & Education",
  "Field Investigation",
  "Research Documentation",
  "Other Services",
];

const initialForm = {
  title: "",
  category: "",
  shortDescription: "",
  description: "",
  status: "Draft",
  imageName: "",
};

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ========================================
  // VNS 2: SERVICE STATISTICS
  // ========================================
  const publishedCount = services.filter(
    (service) => service.status === "Published"
  ).length;

  const draftCount = services.filter(
    (service) => service.status === "Draft"
  ).length;

  // ========================================
  // VNS 3: SEARCH AND FILTER
  // ========================================
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || service.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [services, searchTerm, statusFilter]);

  // ========================================
  // VNS 4: FORM HANDLING
  // ========================================
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    setForm((current) => ({
      ...current,
      imageName: file ? file.name : "",
    }));
  };

  const openNewForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  // ========================================
  // VNS 5: ADD AND UPDATE SERVICE
  // ========================================
  const handleSubmit = (event) => {
    event.preventDefault();

    const serviceData = {
      ...form,
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
    };

    if (editingId !== null) {
      setServices((current) =>
        current.map((service) =>
          service.id === editingId
            ? { ...service, ...serviceData }
            : service
        )
      );
    } else {
      setServices((current) => [
        ...current,
        {
          id: Date.now(),
          ...serviceData,
          createdAt: new Date().toLocaleDateString(),
        },
      ]);
    }

    closeForm();
  };

  // ========================================
  // VNS 6: EDIT SERVICE
  // ========================================
  const handleEdit = (service) => {
    setForm({
      title: service.title,
      category: service.category,
      shortDescription: service.shortDescription,
      description: service.description,
      status: service.status,
      imageName: service.imageName,
    });

    setEditingId(service.id);
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ========================================
  // VNS 7: DELETE SERVICE
  // ========================================
  const handleDelete = (service) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.title}"?`
    );

    if (!confirmed) return;

    setServices((current) =>
      current.filter((item) => item.id !== service.id)
    );
  };

  // ========================================
  // VNS 8: CHANGE PUBLICATION STATUS
  // ========================================
  const togglePublication = (service) => {
    setServices((current) =>
      current.map((item) =>
        item.id === service.id
          ? {
              ...item,
              status:
                item.status === "Published" ? "Draft" : "Published",
            }
          : item
      )
    );
  };

  return (
    <div className="admin-management-page admin-services-page">

      {/* ========================================
          VNS 9: PAGE HEADER
      ======================================== */}
      <div className="admin-management-header">
        <div>
          <span className="admin-section-eyebrow">
            CONTENT MANAGEMENT
          </span>

          <h2>Services Management</h2>

          <p>
            Manage the agricultural services presented on the
            Agric X Trading website.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openNewForm}
        >
          + Add New Service
        </button>
      </div>

      {/* ========================================
          VNS 10: SERVICE STATISTICS
      ======================================== */}
      <section className="admin-service-stats">
        <div className="admin-service-stat-card">
          <span className="admin-service-stat-icon">◇</span>
          <div>
            <span>Total Services</span>
            <strong>{services.length}</strong>
          </div>
        </div>

        <div className="admin-service-stat-card">
          <span className="admin-service-stat-icon published">✓</span>
          <div>
            <span>Published</span>
            <strong>{publishedCount}</strong>
          </div>
        </div>

        <div className="admin-service-stat-card">
          <span className="admin-service-stat-icon draft">◷</span>
          <div>
            <span>Drafts</span>
            <strong>{draftCount}</strong>
          </div>
        </div>
      </section>

      {/* ========================================
          VNS 11: ADD / EDIT SERVICE FORM
      ======================================== */}
      {showForm && (
        <section className="admin-panel admin-content-form admin-service-form">
          <div className="admin-panel-heading">
            <div>
              <h3>{editingId !== null ? "Edit Service" : "Add New Service"}</h3>
              <p>
                Provide the information that visitors will see
                on the public Services page.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">

              <div className="admin-form-group">
                <label htmlFor="service-title">Service Title</label>
                <input
                  id="service-title"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Agricultural Research & Advisory"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="service-category">Service Category</label>
                <select
                  id="service-category"
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select category</option>
                  {serviceCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group admin-full-width">
                <label htmlFor="service-short-description">
                  Short Description
                </label>
                <textarea
                  id="service-short-description"
                  name="shortDescription"
                  rows="3"
                  maxLength="250"
                  value={form.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Write a concise introduction to this service..."
                  required
                />
                <small>
                  {form.shortDescription.length}/250 characters
                </small>
              </div>

              <div className="admin-form-group admin-full-width">
                <label htmlFor="service-description">
                  Full Service Description
                </label>
                <textarea
                  id="service-description"
                  name="description"
                  rows="7"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Describe the service, its scope, activities and benefits..."
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="service-image">Service Cover Image</label>
                <input
                  id="service-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {form.imageName && (
                  <small className="admin-service-file-name">
                    Selected: {form.imageName}
                  </small>
                )}
                <small>
                  Permanent image uploads will be connected to the Media Library.
                </small>
              </div>

              <div className="admin-form-group">
                <label htmlFor="service-status">Publication Status</label>
                <select
                  id="service-status"
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                >
                  <option value="Draft">Save as Draft</option>
                  <option value="Published">Publish Service</option>
                </select>
              </div>

            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button type="submit" className="admin-primary-button">
                {editingId !== null ? "Update Service" : "Save Service"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ========================================
          VNS 12: SERVICE LIST TOOLBAR
      ======================================== */}
      <section className="admin-panel admin-services-list-panel">
        <div className="admin-services-list-heading">
          <div>
            <h3>All Services</h3>
            <p>Review and manage your service listings.</p>
          </div>

          <span className="admin-services-count">
            {filteredServices.length}{" "}
            {filteredServices.length === 1 ? "service" : "services"}
          </span>
        </div>

        <div className="admin-services-toolbar">
          <div className="admin-services-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            aria-label="Filter services by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Drafts</option>
          </select>
        </div>

        {/* ========================================
            VNS 13: SERVICE LIST
        ======================================== */}
        {filteredServices.length > 0 ? (
          <div className="admin-services-list">
            {filteredServices.map((service) => (
              <article className="admin-service-item" key={service.id}>
                <div className="admin-service-item-icon">◇</div>

                <div className="admin-service-item-info">
                  <div className="admin-service-item-title">
                    <h4>{service.title}</h4>

                    <span
                      className={`admin-service-status ${
                        service.status === "Published"
                          ? "is-published"
                          : "is-draft"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>

                  <span className="admin-service-category">
                    {service.category}
                  </span>

                  <p>{service.shortDescription}</p>
                </div>

                <div className="admin-service-actions">
                  <button
                    type="button"
                    onClick={() => handleEdit(service)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePublication(service)}
                  >
                    {service.status === "Published" ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    className="delete-action"
                    onClick={() => handleDelete(service)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-services-empty">
            <div className="admin-empty-icon">◇</div>

            <h3>
              {services.length === 0
                ? "No Services Added Yet"
                : "No Matching Services"}
            </h3>

            <p>
              {services.length === 0
                ? "Your services will appear here after you add them."
                : "Try changing your search or publication filter."}
            </p>

            {services.length === 0 && (
              <button
                type="button"
                className="admin-primary-button"
                onClick={openNewForm}
              >
                Add Your First Service
              </button>
            )}
          </div>
        )}
      </section>

      <p className="admin-services-notice">
        Changes currently exist only in this browser session.
        Database saving and permanent media uploads will be connected
        during backend integration.
      </p>
    </div>
  );
}
