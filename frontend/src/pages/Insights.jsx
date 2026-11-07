
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  BookOpen,
  Video,
  FileText,
  ArrowUpRight,
  Clock,
  Play,
  UserRound,
  CalendarDays,
} from "lucide-react";

import { usePublicCollection } from "../hooks/usePublicData";
import "../styles/pages/Insights.css";

function getResourceDate(resource) {
  return (
    resource.publicationDate ||
    resource.publishedAt ||
    resource.createdAt ||
    resource.updatedAt ||
    ""
  );
}

function formatDate(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getReadingTime(content = "") {
  const text = String(content)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();

  const wordCount = text ? text.split(/\s+/).length : 0;

  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
}

function getShortDescription(resource) {
  const description =
    resource.excerpt ||
    resource.description ||
    resource.content ||
    "";

  return String(description)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCategoryIcon(category) {
  if (category === "Videos") return <Video size={13} />;
  if (category === "Farming Guides") return <FileText size={13} />;
  return <BookOpen size={13} />;
}

function ResourceImage({ resource }) {
  const image =
    resource.type === "video"
      ? resource.thumbnailMedia?.url || ""
      : resource.coverMedia?.url || resource.coverImage || "";

  return (
    <div className="insights-image">
      {image ? (
        <img
          src={image}
          alt={resource.title || "Agricultural resource"}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="insights-image-placeholder">
          {resource.type === "video" ? (
            <Video size={28} />
          ) : (
            <BookOpen size={28} />
          )}
        </div>
      )}

      {resource.type === "video" && (
        <span className="insights-play">
          <Play size={17} fill="currentColor" />
        </span>
      )}
    </div>
  );
}

function CategoryLabel({ category }) {
  return (
    <span className="insights-resource-category">
      {getCategoryIcon(category)}
      {category || "Article"}
    </span>
  );
}

function ArticleMeta({ article }) {
  const date = formatDate(getResourceDate(article));
  const author =
    article.author ||
    article.authorName ||
    article.contributor;

  return (
    <div className="insights-resource-meta">
      <CategoryLabel category={article.category || "Articles"} />

      {author && (
        <span className="insights-meta-detail">
          <UserRound size={13} />
          {author}
        </span>
      )}

      {date && (
        <span className="insights-meta-detail">
          <CalendarDays size={13} />
          {date}
        </span>
      )}

      <span className="insights-meta-detail">
        <Clock size={13} />
        {getReadingTime(article.content || article.excerpt)}
      </span>
    </div>
  );
}

function VideoMeta({ video }) {
  const date = formatDate(getResourceDate(video));

  return (
    <div className="insights-resource-meta">
      <CategoryLabel category="Videos" />

      {video.presenter && (
        <span className="insights-meta-detail">
          <UserRound size={13} />
          {video.presenter}
        </span>
      )}

      {date && (
        <span className="insights-meta-detail">
          <CalendarDays size={13} />
          {date}
        </span>
      )}
    </div>
  );
}

function getResourceLink(resource) {
  return resource.type === "video"
    ? `/insights/videos/${resource.slug}`
    : `/insights/${resource.slug}`;
}

function ResourceCard({ resource, lead = false }) {
  const destination = getResourceLink(resource);
  const description = getShortDescription(resource);

  const cardClasses = [
    "insights-resource-card",
    lead ? "insights-resource-card-lead" : "",
    resource.type === "video"
      ? "insights-resource-card-video"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClasses}>
      <Link
        to={destination}
        className="insights-resource-image-link"
        aria-label={`Open ${resource.title}`}
      >
        <ResourceImage resource={resource} />
      </Link>

      <div className="insights-resource-card-content">
        {resource.type === "video" ? (
          <VideoMeta video={resource} />
        ) : (
          <ArticleMeta article={resource} />
        )}

        <h3>
          <Link to={destination}>{resource.title}</Link>
        </h3>

        {description && (
          <p className="insights-resource-description">
            {description}
          </p>
        )}

        <Link to={destination} className="insights-resource-link">
          {resource.type === "video"
            ? "Watch video"
            : "Read publication"}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export default function Insights() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Articles and videos use separate shared cache entries.
  const {
    data: cachedArticles,
    loading: articlesLoading,
    error: articlesError,
    retry: retryArticles,
  } = usePublicCollection("articles");

  const {
    data: cachedVideos,
    loading: videosLoading,
    error: videosError,
    retry: retryVideos,
  } = usePublicCollection("videos");

  // Memoize fallback arrays to keep their references stable.
  const articles = useMemo(
    () => cachedArticles || [],
    [cachedArticles]
  );

  const videos = useMemo(
    () => cachedVideos || [],
    [cachedVideos]
  );

  const loading = articlesLoading || videosLoading;

  const hasAnyData =
    cachedArticles !== null || cachedVideos !== null;

  const hasAnyResources =
    articles.length > 0 || videos.length > 0;

  const error =
    !hasAnyData && articlesError && videosError
      ? "Unable to load agricultural resources. Please try again."
      : "";

  const categories = useMemo(() => {
    const articleCategories = articles
      .map((article) => article.category)
      .filter(
        (category) =>
          category &&
          category !== "Videos" &&
          category !== "All"
      );

    return [
      "All",
      "Articles",
      "Farming Guides",
      "Videos",
      ...new Set(articleCategories),
    ].filter(
      (category, index, list) =>
        list.indexOf(category) === index
    );
  }, [articles]);

  const allResources = useMemo(() => {
    const writtenResources = articles
      .filter((article) => article.category !== "Videos")
      .map((article) => ({
        ...article,
        type: "article",
        resourceDate: getResourceDate(article),
      }));

    const videoResources = videos.map((video) => ({
      ...video,
      type: "video",
      category: "Videos",
      resourceDate: getResourceDate(video),
    }));

    return [...writtenResources, ...videoResources].sort(
      (a, b) => {
        const dateA = new Date(a.resourceDate).getTime() || 0;
        const dateB = new Date(b.resourceDate).getTime() || 0;

        return dateB - dateA;
      }
    );
  }, [articles, videos]);

  const filteredResources = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return allResources.filter((resource) => {
      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Videos"
          ? resource.type === "video"
          : resource.type === "article" &&
            (activeCategory === "Articles"
              ? resource.category === "Articles"
              : resource.category === activeCategory));

      const searchableText = [
        resource.title,
        resource.excerpt,
        resource.description,
        resource.category,
        resource.author,
        resource.authorName,
        resource.contributor,
        resource.presenter,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [allResources, activeCategory, searchTerm]);

  const resetFilters = () => {
    setActiveCategory("All");
    setSearchTerm("");
  };

  const retryLoading = async () => {
    await Promise.all([
      retryArticles(),
      retryVideos(),
    ]);
  };

  return (
    <div className="inner-page insights-page">
      <section className="insights-masthead">
        <div className="container">
          <div className="insights-masthead-content">
            <div>
              <span className="eyebrow">
                AGRIC X TRADING / INSIGHTS
              </span>

              <h1>
                Knowledge for a better
                <span> agricultural future.</span>
              </h1>
            </div>

            <p>
              Explore agricultural research, practical knowledge,
              industry perspectives and educational resources
              supporting informed decisions across the agricultural
              sector.
            </p>
          </div>
        </div>
      </section>

      <section className="insights-library">
        <div className="container">
          <div className="insights-library-heading">
            <div>
              <span className="eyebrow">
                KNOWLEDGE & EDUCATION
              </span>

              <h2 className="section-heading">
                Latest publications
              </h2>

              <p className="insights-results-count">
                {loading
                  ? "Refreshing resources..."
                  : `${filteredResources.length} ${
                      filteredResources.length === 1
                        ? "resource"
                        : "resources"
                    } available`}
              </p>
            </div>

            <div className="insights-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search publications and videos..."
                aria-label="Search insights"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>
          </div>

          {!loading && !error && (
            <div className="insights-filters">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={
                    activeCategory === category
                      ? "filter-active"
                      : ""
                  }
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {loading && !hasAnyData ? (
            <div className="insights-no-results">
              <BookOpen size={30} />
              <h3>Loading agricultural resources...</h3>
              <p>
                Please wait while we retrieve our latest publications
                and educational videos.
              </p>
            </div>
          ) : error && !hasAnyResources ? (
            <div className="insights-no-results">
              <BookOpen size={30} />
              <h3>Unable to load resources.</h3>
              <p>{error}</p>

              <button
                type="button"
                className="insights-reset-button"
                onClick={retryLoading}
              >
                Try Again
              </button>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="insights-no-results">
              <Search size={30} />

              <h3>
                {allResources.length === 0
                  ? "No published resources yet."
                  : "No matching resources found."}
              </h3>

              <p>
                {allResources.length === 0
                  ? "New agricultural articles, guides, and videos will appear here when they are published."
                  : "Try another search term or select a different category to explore the resource library."}
              </p>

              {(searchTerm || activeCategory !== "All") && (
                <button
                  type="button"
                  className="insights-reset-button"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <section className="insights-unified-section">
              <div className="insights-section-heading">
                <div>
                  <span className="eyebrow">
                    {activeCategory === "All"
                      ? "LATEST KNOWLEDGE & PERSPECTIVES"
                      : "RESOURCE COLLECTION"}
                  </span>

                  <h3>
                    {activeCategory === "All"
                      ? "Explore the knowledge library"
                      : `${activeCategory} resources`}
                  </h3>

                  <p>
                    Discover agricultural publications, practical
                    guides, and educational videos from our resource
                    library.
                  </p>
                </div>

                <span className="insights-more-count">
                  {filteredResources.length}{" "}
                  {filteredResources.length === 1
                    ? "resource"
                    : "resources"}
                </span>
              </div>

              <div className="insights-unified-grid">
                {filteredResources.map((resource, index) => (
                  <ResourceCard
                    key={`${resource.type}-${resource.id || resource.slug}`}
                    resource={resource}
                    lead={index === 0}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <section className="insights-cta">
        <div className="container insights-cta-inner">
          <div>
            <span className="eyebrow">CONNECT WITH US</span>

            <h2>Have an agricultural question or idea?</h2>

            <p>
              We welcome enquiries about agricultural knowledge,
              consultation, training, research, and collaboration.
            </p>
          </div>

          <Link to="/contact" className="primary-button">
            Contact Us
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
