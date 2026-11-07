
import { useEffect, useState } from "react";
import {
  fetchAdminData,
  getAdminCache,
  invalidateAdminData,
  clearAdminDataCache,
} from "../services/adminDataCache";
import "../styles/AdminSettings.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "");

const SETTINGS_CACHE_KEY = "website-settings";
const TOKEN_KEY = "agric_admin_token";
const ADMIN_KEY = "agric_admin";

// Handle expired or unauthorized administrator sessions.
function handleUnauthorized() {
  clearAdminDataCache();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  window.location.replace("/admin/login");
}

function getStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || "{}");
  } catch {
    return {};
  }
}

function normalizeSettings(settings = {}) {
  return {
    companyName: settings.companyName || "",
    email: settings.email || "",
    phone: settings.phone || "",
    address: settings.address || "",
    aboutText: settings.aboutText || "",
  };
}

// Read and validate an API response.
async function readResponse(response, fallbackMessage) {
  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
    throw new Error("Your admin session has expired. Please log in again.");
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

export default function AdminSettings() {
  // ADMIN SESSION
  const storedAdmin = getStoredAdmin();
  const token = localStorage.getItem(TOKEN_KEY);

  // ADMIN PROFILE STATE
  const [profile, setProfile] = useState({
    name: storedAdmin.name || "",
    email: storedAdmin.email || "",
  });

  const [profileNotice, setProfileNotice] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // PASSWORD STATE
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // WEBSITE SETTINGS STATE
  const [websiteSettings, setWebsiteSettings] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    aboutText: "",
  });

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // LOAD CACHED WEBSITE SETTINGS, THEN REFRESH
  useEffect(() => {
    let ignore = false;

    async function loadSettings() {
      const adminToken = localStorage.getItem(TOKEN_KEY);

      if (!adminToken) {
        handleUnauthorized();
        return;
      }

      const cachedSettings = getAdminCache(
        SETTINGS_CACHE_KEY,
        adminToken
      );

      if (cachedSettings !== null) {
        setWebsiteSettings(cachedSettings);
        setSettingsLoading(false);
      }

      try {
        const settings = await fetchAdminData(
          SETTINGS_CACHE_KEY,
          async () => {
            const response = await fetch(`${API_URL}/settings`);

            const data = await readResponse(
              response,
              "Unable to load website settings."
            );

            return normalizeSettings(data.settings);
          },
          adminToken
        );

        if (!ignore) {
          setWebsiteSettings(settings);
          setSettingsError("");
        }
      } catch (error) {
        if (!ignore) {
          setSettingsError(error.message);
        }
      } finally {
        if (!ignore) {
          setSettingsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      ignore = true;
    };
  }, []);

  // HANDLE PROFILE INPUTS
  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setProfileNotice("");
    setProfileError("");
  }

  // SAVE ADMIN PROFILE
  async function handleProfileSubmit(event) {
    event.preventDefault();

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setProfileSaving(true);
      setProfileNotice("");
      setProfileError("");

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await readResponse(
        response,
        "Unable to update administrator profile."
      );

      localStorage.setItem(
        ADMIN_KEY,
        JSON.stringify(data.admin)
      );

      setProfile({
        name: data.admin.name,
        email: data.admin.email,
      });

      setProfileNotice(
        "Administrator profile updated successfully."
      );
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileSaving(false);
    }
  }

  // HANDLE PASSWORD INPUTS
  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPasswordNotice("");
    setPasswordError("");
  }

  // CHANGE ADMIN PASSWORD
  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordNotice("");
      setPasswordError("");

      const response = await fetch(
        `${API_URL}/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        }
      );

      await readResponse(
        response,
        "Unable to change administrator password."
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordNotice(
        "Administrator password changed successfully."
      );
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  // HANDLE WEBSITE SETTINGS INPUTS
  function handleSettingsChange(event) {
    const { name, value } = event.target;

    setWebsiteSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSettingsNotice("");
    setSettingsError("");
  }

  // SAVE WEBSITE SETTINGS
  async function handleSettingsSubmit(event) {
    event.preventDefault();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (!websiteSettings.companyName.trim()) {
      setSettingsError("Company name cannot be empty.");
      return;
    }

    try {
      setSettingsSaving(true);
      setSettingsNotice("");
      setSettingsError("");

      const response = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(websiteSettings),
      });

      const data = await readResponse(
        response,
        "Unable to save website settings."
      );

      const savedSettings = normalizeSettings(data.settings);

      setWebsiteSettings(savedSettings);

      // Refresh the shared cache with successfully saved values.
      invalidateAdminData(SETTINGS_CACHE_KEY);

      await fetchAdminData(
        SETTINGS_CACHE_KEY,
        async () => savedSettings,
        token
      );

      setSettingsNotice("Website settings saved successfully.");
    } catch (error) {
      setSettingsError(error.message);
    } finally {
      setSettingsSaving(false);
    }
  }

  return (
    <div className="admin-settings-page">

      {/* PAGE HEADER */}
      <div className="admin-settings-header">
        <div>
          <span className="admin-settings-eyebrow">
            ACCOUNT MANAGEMENT
          </span>
          <h1>Settings</h1>
          <p>
            Manage your administrator account and website preferences.
          </p>
        </div>
      </div>

      {/* ADMINISTRATOR PROFILE */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-heading">
          <div className="admin-settings-icon">👤</div>

          <div>
            <h2>Administrator Profile</h2>
            <p>View and manage your administrator account details.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit}>
          <div className="admin-settings-form-grid">
            <div className="admin-settings-field">
              <label htmlFor="admin-name">Full Name</label>
              <input
                id="admin-name"
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="Administrator name"
                required
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          {profileError && (
            <div className="admin-settings-notice">
              {profileError}
            </div>
          )}

          {profileNotice && (
            <div className="admin-settings-notice">
              {profileNotice}
            </div>
          )}

          <div className="admin-settings-actions">
            <button
              type="submit"
              className="admin-settings-primary-button"
              disabled={profileSaving}
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      {/* ACCOUNT SECURITY */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-heading">
          <div className="admin-settings-icon">🔒</div>

          <div>
            <h2>Account Security</h2>
            <p>Change your administrator password.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit}>
          <div className="admin-settings-password-grid">
            <div className="admin-settings-field">
              <label htmlFor="current-password">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <p className="admin-settings-hint">
            Use at least 8 characters for your new password.
          </p>

          {passwordError && (
            <div className="admin-settings-notice">
              {passwordError}
            </div>
          )}

          {passwordNotice && (
            <div className="admin-settings-notice">
              {passwordNotice}
            </div>
          )}

          <div className="admin-settings-actions">
            <button
              type="submit"
              className="admin-settings-primary-button"
              disabled={passwordSaving}
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>

      {/* WEBSITE CONFIGURATION */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-heading">
          <div className="admin-settings-icon">🌐</div>

          <div>
            <h2>Website Configuration</h2>
            <p>
              Manage the company information displayed on your website.
            </p>
          </div>
        </div>

        {settingsError && (
          <div className="admin-settings-notice">
            {settingsError}
          </div>
        )}

        {settingsLoading ? (
          <div className="admin-settings-notice">
            Loading website settings...
          </div>
        ) : (
          <form onSubmit={handleSettingsSubmit}>
            <div className="admin-settings-form-grid">
              <div className="admin-settings-field">
                <label htmlFor="company-name">Company Name</label>
                <input
                  id="company-name"
                  type="text"
                  name="companyName"
                  value={websiteSettings.companyName}
                  onChange={handleSettingsChange}
                  placeholder="Company name"
                  required
                />
              </div>

              <div className="admin-settings-field">
                <label htmlFor="company-email">Company Email</label>
                <input
                  id="company-email"
                  type="email"
                  name="email"
                  value={websiteSettings.email}
                  onChange={handleSettingsChange}
                  placeholder="Company email"
                />
              </div>

              <div className="admin-settings-field">
                <label htmlFor="company-phone">Phone Number</label>
                <input
                  id="company-phone"
                  type="tel"
                  name="phone"
                  value={websiteSettings.phone}
                  onChange={handleSettingsChange}
                  placeholder="Company phone number"
                />
              </div>

              <div className="admin-settings-field">
                <label htmlFor="company-address">Company Address</label>
                <input
                  id="company-address"
                  type="text"
                  name="address"
                  value={websiteSettings.address}
                  onChange={handleSettingsChange}
                  placeholder="Company address"
                />
              </div>
            </div>

            <div className="admin-settings-field">
              <label htmlFor="company-about">About the Company</label>
              <textarea
                id="company-about"
                name="aboutText"
                value={websiteSettings.aboutText}
                onChange={handleSettingsChange}
                placeholder="Enter a short company description..."
                rows={5}
              />
            </div>

            {settingsNotice && (
              <div className="admin-settings-notice">
                {settingsNotice}
              </div>
            )}

            <div className="admin-settings-actions">
              <button
                type="submit"
                className="admin-settings-primary-button"
                disabled={settingsSaving}
              >
                {settingsSaving
                  ? "Saving..."
                  : "Save Website Settings"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ADMINISTRATOR SESSION */}
      <section className="admin-settings-card admin-settings-session-card">
        <div className="admin-settings-card-heading">
          <div className="admin-settings-icon">🛡️</div>

          <div>
            <h2>Administrator Session</h2>
            <p>
              Your dashboard is protected by administrator authentication.
            </p>
          </div>
        </div>

        <div className="admin-settings-session-status">
          <span className="admin-settings-session-dot"></span>
          Authentication is active
        </div>

        <p className="admin-settings-session-note">
          Remember to log out when using a shared or public computer.
        </p>
      </section>

    </div>
  );
}
