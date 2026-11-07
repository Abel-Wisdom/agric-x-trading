
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAdminDataCache } from "../services/adminDataCache";
import "../styles/AdminDashboard.css";

const navigation = [
  { label: "Overview", path: "/admin/dashboard", icon: "◈" },
  { label: "Research & Fieldwork", path: "/admin/research", icon: "▤" },
  { label: "Insights & Articles", path: "/admin/insights", icon: "▧" },
  { label: "Media Library", path: "/admin/media", icon: "▣" },
  { label: "Messages", path: "/admin/messages", icon: "✉" },
  { label: "Settings", path: "/admin/settings", icon: "⚙" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem("agric_admin") || "{}");
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    // Clear all cached admin data before ending the session.
    clearAdminDataCache();

    localStorage.removeItem("agric_admin_token");
    localStorage.removeItem("agric_admin");

    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">A</div>
          <div>
            <h2>Agric X Trading</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <div className="admin-sidebar-label">MAIN MENU</div>

        <nav className="admin-sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin/dashboard"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-status">
            <span className="admin-status-dot" />
            Admin session active
          </div>

          <button
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <span>↪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div className="admin-topbar-title">
            <span>ADMINISTRATION</span>
            <h1>Website Management</h1>
          </div>

          <div className="admin-topbar-profile">
            <div className="admin-profile-avatar">
              {(admin.name || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{admin.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
