
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminData,
  getAdminCache,
  invalidateAdminData,
  clearAdminDataCache,
} from "../services/adminDataCache";
import "../styles/AdminMessages.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "") + "/messages";

const CACHE_KEY = "messages";

function getToken() {
  return localStorage.getItem("agric_admin_token");
}

function getHeaders() {
  const token = getToken();

  if (!token) {
    throw new Error("Your admin session has expired. Please log in again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function requestMessages(token) {
  const response = await fetch(API_URL, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (response.status === 401) {
    clearAdminDataCache();
    localStorage.removeItem("agric_admin_token");
    localStorage.removeItem("agric_admin");
    window.location.href = "/admin/login";
    throw new Error("Your admin session has expired. Please log in again.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to load messages.");
  }

  return data.messages || [];
}

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [success, setSuccess] = useState("");

  // Load cached messages immediately, then refresh in the background.
  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      const token = getToken();

      if (!token) {
        setError("Your admin session has expired. Please log in again.");
        setLoading(false);
        return;
      }

      const cachedMessages = getAdminCache(CACHE_KEY, token);

      if (cachedMessages !== null) {
        setMessages(cachedMessages);
        setLoading(false);
      }

      try {
        const freshMessages = await fetchAdminData(
          CACHE_KEY,
          () => requestMessages(token),
          token
        );

        if (!ignore) {
          setMessages(freshMessages);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      ignore = true;
    };
  }, []);

  // MESSAGE STATISTICS
  const unreadCount = messages.filter(
    (message) => message.status === "Unread"
  ).length;

  const readCount = messages.filter(
    (message) => message.status === "Read"
  ).length;

  const repliedCount = messages.filter(
    (message) => message.status === "Replied"
  ).length;

  // SEARCH AND FILTER
  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesFilter =
        activeFilter === "All" || message.status === activeFilter;

      const searchContent = [
        message.name,
        message.email,
        message.subject,
        message.message,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesFilter &&
        searchContent.includes(searchTerm.toLowerCase())
      );
    });
  }, [messages, activeFilter, searchTerm]);

  // FORMAT DATE
  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // UPDATE MESSAGE STATUS
  async function updateStatus(id, status) {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.status === 401) {
        clearAdminDataCache();
        localStorage.removeItem("agric_admin_token");
        localStorage.removeItem("agric_admin");
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update message status.");
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, status } : message
        )
      );

      setSelectedMessage((current) =>
        current?.id === id ? { ...current, status } : current
      );

      invalidateAdminData(CACHE_KEY, "dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // OPEN MESSAGE AND RESET REPLY FORM
  function openMessage(message) {
    setSelectedMessage(message);
    setShowReplyForm(false);
    setReplyText("");
    setSuccess("");
    setError("");

    if (message.status === "Unread") {
      updateStatus(message.id, "Read");
    }
  }

  function openReplyForm() {
    setReplyText("");
    setSuccess("");
    setError("");
    setShowReplyForm(true);
  }

  function cancelReply() {
    setReplyText("");
    setSuccess("");
    setError("");
    setShowReplyForm(false);
  }

  // SEND REPLY THROUGH RESEND
  async function sendReply(event) {
    event.preventDefault();

    if (!replyText.trim() || !selectedMessage || actionLoading) {
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${selectedMessage.id}/reply`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            message: replyText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        clearAdminDataCache();
        localStorage.removeItem("agric_admin_token");
        localStorage.removeItem("agric_admin");
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send reply.");
      }

      const updatedMessage = data.contactMessage;

      setMessages((current) =>
        current.map((item) =>
          item.id === selectedMessage.id
            ? { ...item, ...updatedMessage }
            : item
        )
      );

      setSelectedMessage((current) =>
        current?.id === selectedMessage.id
          ? { ...current, ...updatedMessage }
          : current
      );

      invalidateAdminData(CACHE_KEY, "dashboard");

      setReplyText("");
      setShowReplyForm(false);
      setSuccess("Reply sent successfully.");
    } catch (err) {
      setError(err.message || "Unable to send reply.");
    } finally {
      setActionLoading(false);
    }
  }

  // DELETE MESSAGE
  async function deleteMessage(message) {
    const confirmed = window.confirm(
      `Delete the message from ${message.name}?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${message.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (response.status === 401) {
        clearAdminDataCache();
        localStorage.removeItem("agric_admin_token");
        localStorage.removeItem("agric_admin");
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete message.");
      }

      setMessages((current) =>
        current.filter((item) => item.id !== message.id)
      );

      invalidateAdminData(CACHE_KEY, "dashboard");

      if (selectedMessage?.id === message.id) {
        closeMessage();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // CLOSE MESSAGE MODAL
  function closeMessage() {
    if (actionLoading) return;

    setSelectedMessage(null);
    setShowReplyForm(false);
    setReplyText("");
    setSuccess("");
    setError("");
  }

  // PAGE CONTENT
  return (
    <div className="admin-messages-page">
      <div className="admin-messages-header">
        <div>
          <span className="admin-section-eyebrow">
            COMMUNICATION MANAGEMENT
          </span>
          <h1>Messages</h1>
          <p>
            View and manage enquiries submitted through your website.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-messages-notice" role="alert">
          <span>!</span>
          <div>
            <strong>Message management notice</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* MESSAGE STATISTICS */}
      <div className="admin-message-stats">
        <div className="admin-message-stat-card">
          <span>Total Messages</span>
          <strong>{messages.length}</strong>
        </div>

        <div className="admin-message-stat-card unread">
          <span>Unread</span>
          <strong>{unreadCount}</strong>
        </div>

        <div className="admin-message-stat-card">
          <span>Read</span>
          <strong>{readCount}</strong>
        </div>

        <div className="admin-message-stat-card">
          <span>Replied</span>
          <strong>{repliedCount}</strong>
        </div>
      </div>

      {/* MESSAGE INBOX */}
      <section className="admin-messages-panel">
        <div className="admin-messages-panel-heading">
          <div>
            <h2>Enquiry Inbox</h2>
            <p>Messages received through the contact form.</p>
          </div>

          <span>{filteredMessages.length} messages</span>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="admin-messages-toolbar">
          <div className="admin-message-filters">
            {["All", "Unread", "Read", "Replied"].map((filter) => (
              <button
                type="button"
                key={filter}
                className={
                  activeFilter === filter
                    ? "admin-message-filter active"
                    : "admin-message-filter"
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <input
            type="search"
            className="admin-message-search"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {/* MESSAGE LIST */}
        {loading ? (
          <div className="admin-messages-empty">
            <h3>Loading messages...</h3>
            <p>Please wait while we retrieve your enquiries.</p>
          </div>
        ) : filteredMessages.length > 0 ? (
          <div className="admin-message-list">
            {filteredMessages.map((message) => (
              <article
                className={`admin-message-item ${
                  message.status === "Unread" ? "is-unread" : ""
                }`}
                key={message.id}
              >
                <div className="admin-message-avatar">
                  {message.name.charAt(0).toUpperCase()}
                </div>

                <div className="admin-message-main">
                  <div className="admin-message-topline">
                    <strong>{message.name}</strong>

                    <span
                      className={`admin-message-status ${message.status.toLowerCase()}`}
                    >
                      {message.status}
                    </span>
                  </div>

                  <h3>{message.subject}</h3>
                  <p>{message.message}</p>

                  <div className="admin-message-meta">
                    <span>{message.email}</span>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>

                  <div className="admin-message-actions">
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      disabled={actionLoading}
                    >
                      View Message
                    </button>

                    <button
                      type="button"
                      className="admin-message-delete"
                      onClick={() => deleteMessage(message)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-messages-empty">
            <span>✉</span>
            <h3>No messages found</h3>
            <p>
              Try changing your search or selecting another message filter.
            </p>
          </div>
        )}
      </section>

      {/* MESSAGE DETAILS MODAL */}
      {selectedMessage && (
        <div
          className="admin-message-modal-overlay"
          onClick={closeMessage}
        >
          <div
            className="admin-message-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-message-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-message-modal-header">
              <div>
                <span className="admin-section-eyebrow">
                  ENQUIRY DETAILS
                </span>

                <h2 id="admin-message-modal-title">
                  {selectedMessage.subject}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close message"
                onClick={closeMessage}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>

            {/* ORIGINAL MESSAGE */}
            <div className="admin-message-sender">
              <strong>{selectedMessage.name}</strong>

              <a href={`mailto:${selectedMessage.email}`}>
                {selectedMessage.email}
              </a>

              <span>{formatDate(selectedMessage.createdAt)}</span>
            </div>

            <div className="admin-message-full-content">
              {selectedMessage.message}
            </div>

            {/* MESSAGE STATUS */}
            <div className="admin-message-modal-footer">
              <div>
                <label htmlFor="message-status">
                  Message status
                </label>

                <select
                  id="message-status"
                  value={selectedMessage.status}
                  disabled={actionLoading}
                  onChange={(event) =>
                    updateStatus(selectedMessage.id, event.target.value)
                  }
                >
                  <option value="Unread">Unread</option>
                  <option value="Read">Read</option>
                  <option value="Replied">Replied</option>
                </select>
              </div>
            </div>

            {success && (
              <p className="admin-message-success" role="status">
                {success}
              </p>
            )}

            {!showReplyForm && (
              <div className="admin-message-reply-action">
                <button
                  type="button"
                  className="admin-message-reply-button"
                  onClick={openReplyForm}
                  disabled={actionLoading}
                >
                  Reply
                </button>
              </div>
            )}

            {showReplyForm && (
              <form
                className="admin-message-reply-form"
                onSubmit={sendReply}
              >
                <h3>Reply to Enquiry</h3>

                <p>
                  To: <strong>{selectedMessage.email}</strong>
                </p>

                <label htmlFor="admin-message-reply">
                  Your response
                </label>

                <textarea
                  id="admin-message-reply"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Write your response here..."
                  rows={6}
                  required
                  disabled={actionLoading}
                />

                <div className="admin-message-reply-form-actions">
                  <button
                    type="button"
                    onClick={cancelReply}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-message-reply-button"
                    disabled={actionLoading || !replyText.trim()}
                  >
                    {actionLoading ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

