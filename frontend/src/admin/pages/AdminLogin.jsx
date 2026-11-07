// ========================================
// VNS 1: IMPORTS
// Admin login page and its required styles.
// ========================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // VNS 2: HANDLE ADMIN LOGIN
  // Sends credentials to the backend API.
  // ========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed.");
      }

      // Save the JWT for authenticated API requests.
      localStorage.setItem("agric_admin_token", data.token);

      // Save basic admin information for the dashboard.
      localStorage.setItem(
        "agric_admin",
        JSON.stringify(data.admin)
      );

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // VNS 3: LOGIN PAGE UI
  // ========================================
  return (
    <main className="admin-login-page">
      <div className="admin-login-background" />

      <section className="admin-login-card">
        <div className="admin-login-brand">
          <div className="admin-brand-mark">A</div>

          <div>
            <h1>Agric X Trading</h1>
            <span>ADMINISTRATION PORTAL</span>
          </div>
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-eyebrow">WELCOME BACK</span>
          <h2>Admin Sign In</h2>
          <p>
            Sign in to access your website management dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label htmlFor="admin-email">Email Address</label>

            <input
              id="admin-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>

            <div className="admin-password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="admin-login-footer">
          <span>Authorized personnel only.</span>
          <span>© {new Date().getFullYear()} Agric X Trading</span>
        </div>
      </section>
    </main>
  );
}