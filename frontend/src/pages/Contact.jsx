
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
} from "lucide-react";
import "../styles/pages/Contact.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("");
    setStatusType("");

    try {
      const response = await fetch(`${API_URL.replace(/\/$/, "")}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Your enquiry could not be sent. Please try again."
        );
      }

      setStatus(
        "Thank you for contacting Agric X Trading. Your enquiry has been sent successfully."
      );
      setStatusType("success");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form submission failed:", error);

      setStatus(
        error.message ||
          "Something went wrong while sending your enquiry. Please try again."
      );
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="inner-page contact-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">CONTACT AGRIC X TRADING</span>
          <h1>
            Let's start a
            <span> meaningful conversation.</span>
          </h1>
          <p>
            Have a question about agricultural research, consultation,
            training, or our services? We'd like to hear from you.
          </p>
        </div>
      </section>

      <section className="contact-content section-padding">
        <div className="container contact-grid">
          <div className="contact-information">
            <span className="eyebrow">GET IN TOUCH</span>
            <h2 className="section-heading">
              We'd be glad to hear from you.
            </h2>
            <p>
              Whether you're a farmer, agricultural professional,
              organization, or potential partner, you can use this page
              to make an enquiry.
            </p>

            <div className="contact-detail">
              <div className="contact-detail-icon">
                <Mail size={21} />
              </div>
              <div>
                <h3>Email</h3>
                <p>Company email address to be confirmed.</p>
              </div>
            </div>

            <div className="contact-detail">
              <div className="contact-detail-icon">
                <Phone size={21} />
              </div>
              <div>
                <h3>Phone</h3>
                <p>Company phone number to be confirmed.</p>
              </div>
            </div>

            <div className="contact-detail">
              <div className="contact-detail-icon">
                <MapPin size={21} />
              </div>
              <div>
                <h3>Location</h3>
                <p>Company office address to be confirmed.</p>
              </div>
            </div>

            <div className="contact-note">
              <MessageSquare size={20} />
              <p>
                For research, training, consultation, and partnership
                enquiries, please provide as much relevant information
                as possible.
              </p>
            </div>
          </div>

          <div className="contact-form-card">
            <h2>Send us an enquiry</h2>
            <p>Complete the form and tell us how we can help.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="contact-name">Full name</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="contact-email">Email address</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="contact-subject">Subject</label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  placeholder="What is your enquiry about?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  placeholder="Write your message..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="primary-button contact-submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Enquiry"}
                {!isSubmitting && <Send size={17} />}
              </button>

              {status && (
                <p
                  className="contact-form-status"
                  role="status"
                  style={{
                    color: statusType === "error" ? "#c0392b" : undefined,
                  }}
                >
                  {status}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
