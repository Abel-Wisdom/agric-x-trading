import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Download,
  FileText,
  Microscope,
  Tag,
} from "lucide-react";

import { usePublicDetail } from "../hooks/usePublicData";
import { loadPublicDetail } from "../services/publicDataCache";
import "../styles/pages/ResearchDetails.css";

function formatPublicationDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calculateReadingTime(content = "") {
  const plainText = String(content).replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;

  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
}

function getPdfDownloadUrl(pdfUrl = "") {
  if (!pdfUrl) return "";

  try {
    const url = new URL(pdfUrl);

    if (!url.pathname.includes("/upload/")) {
      return pdfUrl;
    }

    url.pathname = url.pathname.replace(
      "/upload/",
      "/upload/fl_attachment/"
    );

    return url.toString();
  } catch {
    return pdfUrl;
  }
}

// Sanitize rich-text content and allow only trusted video embeds.
function sanitizeResearchContent(content = "") {
  const sanitized = DOMPurify.sanitize(content, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "loading",
      "referrerpolicy",
      "sandbox",
    ],
  });

  const document = new DOMParser().parseFromString(
    sanitized,
    "text/html"
  );

  document.querySelectorAll("iframe").forEach((iframe) => {
    const source = iframe.getAttribute("src");

    const allowedHosts = [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
    ];

    try {
      const url = new URL(source);

      if (
        url.protocol !== "https:" ||
        !allowedHosts.includes(url.hostname)
      ) {
        iframe.remove();
      }
    } catch {
      iframe.remove();
    }
  });

  return document.body.innerHTML;
}

function formatBackendReport(report) {
  if (!report) return null;

  return {
    id: report.id,
    title: report.title,
    slug: report.slug,
    category: report.category,
    subtitle: report.description,
    publicationDate: formatPublicationDate(report.publicationDate),
    readingTime: calculateReadingTime(report.content),
    coverImage: report.coverMedia?.url || "",
    pdfUrl: report.pdfMedia?.url || "",
    content: report.content || "",
    location: report.location || "",
    reportType: "Research Report",
    author: "Agric X Trading",
    topics: [
      report.category,
      report.location,
    ].filter(Boolean),
    isBackendReport: true,
  };
}

// Keep report-card navigation prefetching connected to the shared cache.
// eslint-disable-next-line react-refresh/only-export-components
export function prefetchResearchReport(slug) {  return loadPublicDetail("research", slug).catch((error) => {
    console.warn("Research report prefetch failed:", error);
  });
}

export default function ResearchDetails() {
  const { slug } = useParams();

  const {
    data: cachedReport,
    loading,
    error,
    retry,
  } = usePublicDetail("research", slug);

  const report = formatBackendReport(cachedReport);

  // First-visit loading state.
  if (loading && !report) {
    return (
      <div className="inner-page detail-page">
        <section className="detail-placeholder section-padding">
          <div className="container">
            <Link to="/research" className="back-link">
              <ArrowLeft size={17} />
              Back to Research
            </Link>

            <div className="detail-placeholder-content">
              <FileText size={38} />
              <span className="eyebrow">RESEARCH REPORT</span>
              <h1>Loading research report...</h1>
              <p>
                Please wait while we retrieve the research publication.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Only reports currently published in the backend are accessible.
  if (!report) {
    return (
      <div className="inner-page detail-page">
        <section className="detail-placeholder section-padding">
          <div className="container">
            <Link to="/research" className="back-link">
              <ArrowLeft size={17} />
              Back to Research
            </Link>

            <div className="detail-placeholder-content">
              <FileText size={38} />
              <span className="eyebrow">RESEARCH REPORT</span>
              <h1>Research report not found</h1>
              <p>
                {error ||
                  "This research report is not currently available. Please explore our research library for published reports."}
              </p>

              {error && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={retry}
                >
                  Try Again
                </button>
              )}

              <Link to="/research" className="primary-button">
                Explore Research
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const safeContent = sanitizeResearchContent(report.content);
  const pdfDownloadUrl = getPdfDownloadUrl(report.pdfUrl);

  return (
    <div className="inner-page detail-page research-detail-page">
      <section className="research-report-hero">
        <div className="container">
          <Link to="/research" className="report-back-link">
            <ArrowLeft size={17} />
            Back to Research
          </Link>

          <div className="report-hero-content">
            <span className="report-category">
              <Microscope size={15} />
              {report.category}
            </span>

            <h1>{report.title}</h1>
            <p>{report.subtitle}</p>

            <div className="report-meta">
              <span>
                <CalendarDays size={16} />
                {report.publicationDate}
              </span>

              <span>
                <FileText size={16} />
                {report.readingTime}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="research-report-body section-padding">
        <div className="container">
          <div className="report-layout">
            <main className="report-main">
              {report.coverImage && (
                <div className="report-cover">
                  <img
                    src={report.coverImage}
                    alt={`${report.title} research cover`}
                    loading="eager"
                    decoding="async"
                  />

                  <div className="report-cover-caption">
                    <span>RESEARCH PUBLICATION</span>
                    <span>{report.reportType}</span>
                  </div>
                </div>
              )}

              <div
                className="report-rich-content"
                dangerouslySetInnerHTML={{
                  __html: safeContent,
                }}
              />

              {report.pdfUrl && (
                <section className="report-pdf-viewer">
                  <h2>PDF Research Publication</h2>

                  <iframe
                    src={report.pdfUrl}
                    title={`${report.title} PDF publication`}
                    width="100%"
                    height="750"
                    loading="lazy"
                  />

                  <a
                    href={report.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={17} />
                    Open PDF in a new tab
                  </a>
                </section>
              )}
            </main>

            <aside className="report-sidebar">
              <div className="report-sidebar-card">
                <h3>Report Information</h3>

                <div className="report-sidebar-item">
                  <FileText size={18} />
                  <div>
                    <span>Publication type</span>
                    <strong>{report.reportType}</strong>
                  </div>
                </div>

                <div className="report-sidebar-item">
                  <CalendarDays size={18} />
                  <div>
                    <span>Publication date</span>
                    <strong>{report.publicationDate}</strong>
                  </div>
                </div>

                <div className="report-sidebar-item">
                  <Tag size={18} />
                  <div>
                    <span>Category</span>
                    <strong>{report.category}</strong>
                  </div>
                </div>

                <div className="report-sidebar-item">
                  <Microscope size={18} />
                  <div>
                    <span>Prepared by</span>
                    <strong>{report.author}</strong>
                  </div>
                </div>

                <div className="report-topics">
                  <h4>Topics</h4>
                  <div>
                    {report.topics.map((topic) => (
                      <span key={topic}>{topic}</span>
                    ))}
                  </div>
                </div>

                {report.pdfUrl ? (
                  <a
                    className="report-download-button"
                    href={pdfDownloadUrl}
                    download
                  >
                    <Download size={17} />
                    Download PDF
                  </a>
                ) : (
                  <button
                    className="report-download-button"
                    disabled
                  >
                    <Download size={17} />
                    PDF version unavailable
                  </button>
                )}
              </div>

              <div className="report-contact-card">
                <h3>Interested in our research?</h3>
                <p>
                  Contact Agric X Trading to learn more about its
                  agricultural research and fieldwork activities.
                </p>
                <Link to="/contact">
                  Contact Us <ArrowRight size={16} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}