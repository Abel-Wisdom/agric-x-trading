
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchAdminData,
  getAdminCache,
  clearAdminDataCache,
} from "../services/adminDataCache";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "");

const initialStats = {
  researchReports: 0,
  publishedResearchReports: 0,
  draftResearchReports: 0,
  publishedArticles: 0,
  draftArticles: 0,
  publishedVideos: 0,
  draftVideos: 0,
  mediaAssets: 0,
  messagesReceived: 0,
  unreadMessages: 0,
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboardStats = async () => {
      const token = localStorage.getItem("agric_admin_token");

      if (!token) {
        clearAdminDataCache();

        if (isMounted) {
          setError("Admin authentication is required.");
          setLoading(false);
          navigate("/admin/login");
        }

        return;
      }

      // Display previously cached statistics immediately.
      const cachedStats = getAdminCache("dashboard", token);

      if (cachedStats && isMounted) {
        setStats({ ...initialStats, ...cachedStats });
        setLoading(false);
      }

      try {
        const freshStats = await fetchAdminData(
          "dashboard",
          async () => {
            const response = await fetch(`${API_URL}/dashboard/stats`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
              clearAdminDataCache();
              localStorage.removeItem("agric_admin_token");
              localStorage.removeItem("agric_admin");

              throw new Error("Your admin session has expired. Please log in again.");
            }

            if (!response.ok) {
              throw new Error(
                data.message || "Unable to load dashboard statistics."
              );
            }

            if (!data.stats) {
              throw new Error("Dashboard statistics were not returned.");
            }

            return data.stats;
          },
          token
        );

        if (isMounted) {
          setStats({ ...initialStats, ...freshStats });
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load dashboard statistics.");

          if (
            err.message?.includes("session has expired") ||
            err.message?.includes("authentication is required")
          ) {
            navigate("/admin/login");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardStats();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const statCards = [
    {
      label: "Research Reports",
      value: stats.researchReports,
      icon: "▧",
    },
    {
      label: "Published Articles",
      value: stats.publishedArticles,
      icon: "▣",
    },
    {
      label: "Messages Received",
      value: stats.messagesReceived,
      icon: "✉",
    },
  ];

  const overviewItems = [
    {
      label: "Research & Fieldwork",
      detail: `${stats.publishedResearchReports} published · ${stats.draftResearchReports} drafts`,
      value: stats.researchReports,
      path: "/admin/research",
    },
    {
      label: "Published Articles",
      detail: `${stats.draftArticles} drafts awaiting publication`,
      value: stats.publishedArticles,
      path: "/admin/insights",
    },
    {
      label: "Published Videos",
      detail: `${stats.draftVideos} drafts`,
      value: stats.publishedVideos,
      path: "/admin/media",
    },
    {
      label: "Media Library",
      detail: "Uploaded media resources",
      value: stats.mediaAssets,
      path: "/admin/media",
    },
    {
      label: "Unread Enquiries",
      detail: `${stats.messagesReceived} total messages received`,
      value: stats.unreadMessages,
      path: "/admin/messages",
    },
  ];

  const quickActions = [
    {
      title: "Add Research Report",
      description: "Manage research and fieldwork reports",
      icon: "＋",
      path: "/admin/research",
    },
    {
      title: "Write New Article",
      description: "Create an insight or publication",
      icon: "＋",
      path: "/admin/insights",
    },
    {
      title: "Upload Media",
      description: "Manage images and media resources",
      icon: "＋",
      path: "/admin/media",
    },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-welcome">
        <div>
          <span className="admin-section-eyebrow">
            DASHBOARD OVERVIEW
          </span>

          <h2>Welcome back, Administrator</h2>

          <p>
            Manage Agric X Trading's agricultural research,
            publications, media and website enquiries from one place.
          </p>
        </div>

        <div className="admin-welcome-date">
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          style={{
            color: "#b42318",
            background: "#fff1f0",
            padding: "12px 15px",
            borderRadius: "6px",
            marginBottom: "18px",
            fontSize: "12px",
          }}
        >
          {error}
        </p>
      )}

      <section className="admin-stats-grid">
        {statCards.map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <div className="admin-stat-top">
              <span>{stat.label}</span>
              <div className="admin-stat-icon">{stat.icon}</div>
            </div>

            <strong>
              {loading ? "..." : stat.value.toLocaleString()}
            </strong>

            <small>
              {loading
                ? "Retrieving database information"
                : "Live database count"}
            </small>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel admin-quick-actions">
          <div className="admin-panel-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Direct access to common management tasks</p>
            </div>
          </div>

          <div className="admin-quick-action-list">
            {quickActions.map((action) => (
              <Link
                to={action.path}
                className="admin-quick-action"
                key={action.title}
                style={{
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <span>{action.icon}</span>

                <div>
                  <strong>{action.title}</strong>
                  <small>{action.description}</small>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="admin-panel admin-system-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Content & Operations Overview</h3>
              <p>A snapshot of Agric X Trading's content activities</p>
            </div>
          </div>

          {overviewItems.map((item) => (
            <Link
              to={item.path}
              className="admin-system-item"
              key={item.label}
              style={{
                textDecoration: "none",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <div>
                <span style={{ display: "block" }}>{item.label}</span>
                <small
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#a0a99f",
                    fontSize: "9px",
                  }}
                >
                  {item.detail}
                </small>
              </div>

              <strong style={{ fontSize: "15px", color: "#286340" }}>
                {loading ? "..." : item.value.toLocaleString()}
              </strong>
            </Link>
          ))}
        </article>
      </section>
    </div>
  );
}
