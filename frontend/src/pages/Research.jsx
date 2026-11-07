
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Microscope,
  FileText,
  MapPin,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock3,
  ArrowRight,
} from "lucide-react";

import { usePublicCollection } from "../hooks/usePublicData";
import "../styles/pages/Research.css";

// Format publication dates consistently.
function formatPublicationDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Estimate how long the report takes to read.
function calculateReadingTime(content = "") {
  const plainText = String(content).replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));

  return `${minutes} min read`;
}

// Convert backend reports into the format used by the report cards.
function formatBackendReport(report) {
  return {
    id: `backend-${report.id}`,
    title: report.title,
    slug: report.slug,
    category: report.category,
    subtitle: report.description,
    coverImage: report.coverMedia?.url || "",
    publicationDate: formatPublicationDate(report.publicationDate),
    readingTime: calculateReadingTime(report.content),
    topics: [report.category, report.location].filter(Boolean),
    location: report.location || "",
  };
}

export default function Research() {
  const [searchTerm, setSearchTerm] = useState("");

  // Read from the shared application-wide cache.
  const {
    data: cachedReports,
    loading,
    error,
    retry,
  } = usePublicCollection("research");

  // Format the raw backend records for the existing report cards.
  const publishedReports = useMemo(
    () => (cachedReports || []).map(formatBackendReport),
    [cachedReports]
  );

  const allReports = useMemo(
    () => publishedReports,
    [publishedReports]
  );

  // Search report titles, descriptions, categories, and topics.
  const filteredReports = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return allReports.filter((report) => {
      const searchableContent = [
        report.title,
        report.subtitle,
        report.category,
        report.location,
        ...(report.topics || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(query);
    });
  }, [allReports, searchTerm]);

  return (
    <div className="inner-page research-page">
      {/* COMPACT INTRODUCTION */}
      <section className="research-introduction">
        <div className="container research-intro-grid">
          <div className="research-intro-heading">
            <span className="eyebrow">RESEARCH & FIELDWORK</span>

            <h1>
              Understanding agriculture through research and experience.
            </h1>

            <span className="research-intro-accent" />
          </div>

          <div className="research-intro-copy">
            <p className="research-intro-lead">
              Agricultural knowledge becomes more meaningful when it is
              grounded in real farming environments and experiences.
            </p>

            <p>
              We explore agricultural realities through field observations,
              investigation, professional knowledge, and engagement with
              farming communities.
            </p>

            <p>
              Our work considers the different soils, climates, resources,
              production systems, and challenges that shape farming across
              locations.
            </p>
          </div>
        </div>
      </section>

      {/* RESEARCH LIBRARY */}
      <section className="research-library section-padding">
        <div className="container">
          <div className="library-heading">
            <div>
              <span className="eyebrow">RESEARCH LIBRARY</span>

              <h2 className="section-heading">
                Reports, investigations & field records
              </h2>

              <p>
                Explore documented agricultural research, investigations,
                and fieldwork records from Agric X Trading.
              </p>
            </div>

            <div className="library-search">
              <Search size={19} />

              <input
                type="search"
                placeholder="Search research..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search research reports"
              />
            </div>
          </div>

          {/* FIRST-VISIT LOADING STATE */}
          {loading && publishedReports.length === 0 ? (
            <div className="research-loading-state" role="status">
              <span className="research-loading-spinner" />
              <span>Loading published research...</span>
            </div>
          ) : error && publishedReports.length === 0 ? (
            <div className="library-empty">
              <div className="library-empty-icon">
                <FileText size={32} />
              </div>

              <span className="eyebrow">RESEARCH COLLECTION</span>

              <h3>Unable to load research reports.</h3>

              <p>{error}</p>

              <button
                type="button"
                className="research-clear-search"
                onClick={retry}
                disabled={loading}
              >
                {loading ? "Retrying..." : "Try Again"}
              </button>
            </div>
          ) : filteredReports.length > 0 ? (
            <>
              <div className="research-results-label">
                <span>
                  {searchTerm
                    ? `${filteredReports.length} matching ${
                        filteredReports.length === 1 ? "report" : "reports"
                      }`
                    : `${filteredReports.length} ${
                        filteredReports.length === 1
                          ? "publication"
                          : "publications"
                      }`}
                </span>
              </div>

              <div className="research-report-grid">
                {filteredReports.map((report) => (
                  <article
                    className="research-report-card"
                    key={report.id}
                  >
                    <Link
                      to={`/research/${report.slug}`}
                      className="research-report-image"
                      aria-label={`Read ${report.title}`}
                    >
                      {report.coverImage ? (
                        <img
                          src={report.coverImage}
                          alt={report.title}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="research-image-placeholder">
                          <FileText size={42} />
                          <span>Research publication</span>
                        </div>
                      )}

                      <span className="research-report-image-icon">
                        <ArrowUpRight size={20} />
                      </span>
                    </Link>

                    <div className="research-report-card-content">
                      <div className="research-report-category">
                        <span>{report.category}</span>
                      </div>

                      <h3>
                        <Link to={`/research/${report.slug}`}>
                          {report.title}
                        </Link>
                      </h3>

                      <p>{report.subtitle}</p>

                      <div className="research-report-meta">
                        <span>
                          <CalendarDays size={15} />
                          {report.publicationDate}
                        </span>

                        <span>
                          <Clock3 size={15} />
                          {report.readingTime}
                        </span>
                      </div>

                      <Link
                        to={`/research/${report.slug}`}
                        className="research-report-link"
                      >
                        Read Full Report
                        <ArrowRight size={17} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="library-empty">
              <div className="library-empty-icon">
                <FileText size={32} />
              </div>

              <span className="eyebrow">RESEARCH COLLECTION</span>

              <h3>
                {searchTerm
                  ? "No matching research reports found."
                  : "Research reports will appear here."}
              </h3>

              <p>
                {searchTerm
                  ? `We couldn't find a report matching "${searchTerm}". Try another search term.`
                  : "The research library is being prepared for the company's documented reports, investigations, and field records."}
              </p>

              {searchTerm && (
                <button
                  type="button"
                  className="research-clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* RESEARCH METHODOLOGY */}
      <section className="research-method section-padding">
        <div className="container">
          <div className="research-method-heading">
            <div>
              <span className="eyebrow">OUR RESEARCH APPROACH</span>

              <h2 className="section-heading">
                From field observation to agricultural knowledge.
              </h2>
            </div>

            <p>
              We approach agricultural research as a process of observing,
              investigating, documenting, and sharing knowledge from
              real-world experiences.
            </p>
          </div>

          <div className="research-method-grid">
            <article className="method-card">
              <span className="method-number">01</span>
              <MapPin size={25} />

              <h3>Field Observation</h3>

              <p>
                Visiting agricultural environments and observing farming
                conditions, practices, and production systems.
              </p>
            </article>

            <article className="method-card">
              <span className="method-number">02</span>
              <Microscope size={25} />

              <h3>Investigation</h3>

              <p>
                Examining agricultural challenges and gathering relevant
                information from field experiences.
              </p>
            </article>

            <article className="method-card">
              <span className="method-number">03</span>
              <BookOpen size={25} />

              <h3>Documentation</h3>

              <p>
                Organizing research records, observations, and documented
                findings for future reference.
              </p>
            </article>

            <article className="method-card">
              <span className="method-number">04</span>
              <FileText size={25} />

              <h3>Knowledge Sharing</h3>

              <p>
                Making documented agricultural knowledge accessible to
                relevant audiences.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="research-cta">
        <div className="container research-cta-inner">
          <div>
            <span className="eyebrow">SHARE AN ENQUIRY</span>

            <h2>
              Interested in agricultural research or collaboration?
            </h2>

            <p>
              Contact Agric X Trading to discuss research, fieldwork,
              or agricultural consultation.
            </p>
          </div>

          <Link to="/contact" className="primary-button">
            Contact Us <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
