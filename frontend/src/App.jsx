
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

import MainLayout from "./layouts/MainLayout";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";
import AdminLayout from "./admin/components/AdminLayout";

import "./styles/shared/InnerPages.css";

// Reset scroll position whenever the visitor navigates to another page.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

// Public pages are downloaded only when needed.
const Home = lazy(() => import("./pages/Home.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Research = lazy(() => import("./pages/Research.jsx"));
const ResearchDetails = lazy(() => import("./pages/ResearchDetails.jsx"));
const Services = lazy(() => import("./pages/Services.jsx"));
const Insights = lazy(() => import("./pages/Insights.jsx"));
const ArticleDetails = lazy(() => import("./pages/ArticleDetails.jsx"));
const VideoDetails = lazy(() => import("./pages/VideoDetails.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));

// Admin pages are also downloaded only when an admin opens them.
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard.jsx"));
const AdminResearch = lazy(() => import("./admin/pages/AdminResearch.jsx"));
const AdminInsights = lazy(() => import("./admin/pages/AdminInsights.jsx"));
const AdminMedia = lazy(() => import("./admin/pages/AdminMedia.jsx"));
const AdminMessages = lazy(() => import("./admin/pages/AdminMessages.jsx"));
const AdminSettings = lazy(() => import("./admin/pages/AdminSettings.jsx"));

function PageLoading() {
  return (
    <div
      style={{
        minHeight: "45vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        color: "#496353",
        textAlign: "center",
      }}
    >
      <p>Loading page...</p>
    </div>
  );
}

function LazyPage({ component: Component }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Component />
    </Suspense>
  );
}

function NotFound() {
  return (
    <div className="inner-page detail-page">
      <section className="detail-placeholder section-padding">
        <div className="container detail-placeholder-content">
          <h1>Page not found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <Link to="/" className="primary-button">
            Return Home
          </Link>
        </div>
      </section>
    </div>
  );
}

function AdminNotFound() {
  return (
    <div
      style={{
        minHeight: "55vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "480px" }}>
        <div
          style={{
            fontSize: "64px",
            fontWeight: "800",
            lineHeight: 1,
            color: "#b99a50",
            marginBottom: "20px",
          }}
        >
          404
        </div>

        <h2 style={{ color: "#173d2b", marginBottom: "12px" }}>
          Admin page not found
        </h2>

        <p
          style={{
            color: "#68766d",
            lineHeight: 1.7,
            marginBottom: "28px",
          }}
        >
          The administration page you're looking for doesn't exist
          or may have been moved.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <Link
            to="/admin/dashboard"
            style={{
              background: "#174b32",
              color: "#fff",
              padding: "13px 22px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Back to Dashboard
          </Link>

          <Link
            to="/"
            style={{
              background: "#f1eee5",
              color: "#174b32",
              padding: "13px 22px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Visit Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        {/* PUBLIC WEBSITE ROUTES */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LazyPage component={Home} />} />
          <Route path="/about" element={<LazyPage component={About} />} />
          <Route path="/research" element={<LazyPage component={Research} />} />
          <Route
            path="/research/:slug"
            element={<LazyPage component={ResearchDetails} />}
          />
          <Route path="/services" element={<LazyPage component={Services} />} />

          <Route
            path="/insights"
            element={<LazyPage component={Insights} />}
          />
          <Route
            path="/insights/videos/:slug"
            element={<LazyPage component={VideoDetails} />}
          />
          <Route
            path="/insights/:slug"
            element={<LazyPage component={ArticleDetails} />}
          />

          <Route path="/contact" element={<LazyPage component={Contact} />} />
          <Route path="/404" element={<NotFound />} />
        </Route>

        {/* ADMIN LOGIN */}
        <Route
          path="/admin/login"
          element={<LazyPage component={AdminLogin} />}
        />

        {/* PROTECTED ADMIN ROUTES */}
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route
              path="dashboard"
              element={<LazyPage component={AdminDashboard} />}
            />
            <Route
              path="research"
              element={<LazyPage component={AdminResearch} />}
            />
            <Route
              path="insights"
              element={<LazyPage component={AdminInsights} />}
            />
            <Route
              path="media"
              element={<LazyPage component={AdminMedia} />}
            />
            <Route
              path="messages"
              element={<LazyPage component={AdminMessages} />}
            />
            <Route
              path="settings"
              element={<LazyPage component={AdminSettings} />}
            />

            <Route path="*" element={<AdminNotFound />} />
          </Route>
        </Route>

        {/* PUBLIC UNKNOWN ROUTES */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
