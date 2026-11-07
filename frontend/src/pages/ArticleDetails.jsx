
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock3,
  FileText,
  Play,
  Share2,
} from "lucide-react";

import {
  usePublicCollection,
  usePublicDetail,
} from "../hooks/usePublicData";

import "../styles/pages/ArticleDetails.css";

function createSectionId(heading, index) {
  const headingSlug = (heading || `section-${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `article-section-${headingSlug || index + 1}`;
}

function isSafeUrl(value, allowMailto = false) {
  if (!value) return false;

  try {
    const url = new URL(value, window.location.origin);

    const allowedProtocols = allowMailto
      ? ["http:", "https:", "mailto:", "tel:"]
      : ["http:", "https:"];

    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeArticleHTML(html) {
  if (!html || typeof html !== "string") {
    return { html: "", headings: [] };
  }

  const parsedDocument = new DOMParser().parseFromString(
    html,
    "text/html"
  );

  const allowedTags = new Set([
    "p",
    "h1",
    "h2",
    "h3",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "blockquote",
    "figure",
    "figcaption",
    "img",
    "video",
    "a",
    "br",
  ]);

  const blockedTags = new Set([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "svg",
    "math",
  ]);

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createDocumentFragment();
    }

    const tag = node.tagName.toLowerCase();

    if (blockedTags.has(tag)) {
      return document.createDocumentFragment();
    }

    const children = Array.from(node.childNodes).map(cleanNode);

    if (!allowedTags.has(tag)) {
      const fragment = document.createDocumentFragment();

      children.forEach((child) => fragment.appendChild(child));

      return fragment;
    }

    const element = document.createElement(tag);

    if (tag === "figure") {
      const isVideo = node.hasAttribute("data-article-video");

      element.className = isVideo
        ? "article-video-block"
        : "article-inline-image";
    }

    if (tag === "img") {
      const src = node.getAttribute("src");

      if (isSafeUrl(src)) {
        element.setAttribute("src", src);
      }

      element.setAttribute(
        "alt",
        node.getAttribute("alt") || ""
      );

      const title = node.getAttribute("title");

      if (title) element.setAttribute("title", title);

      element.setAttribute("loading", "lazy");
    }

    if (tag === "video") {
      const src = node.getAttribute("src");

      if (isSafeUrl(src)) {
        element.setAttribute("src", src);
      }

      element.setAttribute("controls", "");
      element.setAttribute("preload", "metadata");
    }

    if (tag === "a") {
      const href = node.getAttribute("href");

      if (isSafeUrl(href, true)) {
        element.setAttribute("href", href);

        if (href.startsWith("http")) {
          element.setAttribute("target", "_blank");
          element.setAttribute("rel", "noopener noreferrer");
        }
      }
    }

    children.forEach((child) => element.appendChild(child));

    return element;
  }

  const cleanContainer = document.createElement("div");

  Array.from(parsedDocument.body.childNodes)
    .map(cleanNode)
    .forEach((node) => cleanContainer.appendChild(node));

  const headings = [];
  const usedIds = new Set();

  cleanContainer.querySelectorAll("h2, h3").forEach((heading, index) => {
    const text = heading.textContent.trim();

    if (!text) return;

    let id = createSectionId(text, index);
    let suffix = 2;

    while (usedIds.has(id)) {
      id = `${createSectionId(text, index)}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(id);
    heading.id = id;

    headings.push({
      heading: text,
      id,
    });
  });

  return {
    html: cleanContainer.innerHTML,
    headings,
  };
}

function getReadingTime(content) {
  if (!content) return "1 min read";

  const text = String(content).replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getResourceTitle(resource) {
  return resource.title || resource.name || "Untitled publication";
}

function getResourceSlug(resource) {
  return resource.slug || resource.id;
}

function getResourceCategory(resource, fallback) {
  const category = resource.category;

  if (typeof category === "string") return category;
  if (category?.name) return category.name;

  return fallback;
}

function getResourceDescription(resource) {
  const description =
    resource.excerpt ||
    resource.description ||
    resource.summary ||
    "";

  return typeof description === "string"
    ? description.replace(/<[^>]*>/g, "").trim()
    : "";
}

function getResourceImage(resource) {
  return (
    resource.coverMedia?.url ||
    resource.thumbnailMedia?.url ||
    resource.coverImage ||
    resource.coverImageUrl ||
    resource.thumbnail ||
    resource.thumbnailUrl ||
    resource.image ||
    resource.imageUrl ||
    ""
  );
}

function getResourceDate(resource) {
  return formatDate(
    resource.publicationDate ||
    resource.publishedAt ||
    resource.published_at ||
    resource.createdAt ||
    resource.created_at
  );
}

function getRecommendationLink(resource) {
  const slug = getResourceSlug(resource);

  if (!slug) return "/insights";

  return resource.type === "video"
    ? `/insights/videos/${slug}`
    : `/insights/${slug}`;
}

function RecommendationCard({ resource }) {
  const image = getResourceImage(resource);
  const title = getResourceTitle(resource);
  const description = getResourceDescription(resource);
  const category = getResourceCategory(
    resource,
    resource.type === "video" ? "Video" : "Publication"
  );

  return (
    <Link
      to={getRecommendationLink(resource)}
      className="article-related-item article-dynamic-recommendation"
    >
      <div className="article-recommendation-image">
        {image ? (
          <img src={image} alt="" loading="lazy" />
        ) : (
          <span className="article-recommendation-placeholder">
            {resource.type === "video" ? (
              <Play size={20} />
            ) : (
              <FileText size={20} />
            )}
          </span>
        )}

        {resource.type === "video" && (
          <span className="article-recommendation-play">
            <Play size={12} fill="currentColor" />
          </span>
        )}
      </div>

      <span className="article-recommendation-content">
        <small>{category}</small>
        <strong>{title}</strong>

        {description && <em>{description}</em>}

        <span className="article-recommendation-meta">
          {resource.type === "video" ? "Watch video" : "Read publication"}
          <ArrowUpRight size={13} />

          {getResourceDate(resource) && (
            <span>{getResourceDate(resource)}</span>
          )}
        </span>
      </span>
    </Link>
  );
}

export default function ArticleDetails() {
  const { slug } = useParams();

  const {
    data: article,
    loading: articleLoading,
    error: articleError,
    retry: retryArticle,
  } = usePublicDetail("articles", slug);

  const {
    data: publishedArticles,
    loading: articlesLoading,
  } = usePublicCollection("articles");

  const {
    data: publishedVideos,
    loading: videosLoading,
  } = usePublicCollection("videos");

  const recommendationsLoading =
    articlesLoading || videosLoading;

  const recommendations = useMemo(() => {
    const articleItems = (publishedArticles || []).map((item) => ({
      ...item,
      type: "article",
    }));

    const videoItems = (publishedVideos || []).map((item) => ({
      ...item,
      type: "video",
    }));

    return [...articleItems, ...videoItems]
      .filter((item) => {
        const itemSlug = String(getResourceSlug(item) || "");

        return itemSlug && itemSlug !== String(slug);
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.publicationDate ||
          a.publishedAt ||
          a.published_at ||
          a.createdAt ||
          0
        ).getTime();

        const dateB = new Date(
          b.publicationDate ||
          b.publishedAt ||
          b.published_at ||
          b.createdAt ||
          0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [publishedArticles, publishedVideos, slug]);

  const isLegacyArticle = Boolean(article?.sections);

  const articleContent = useMemo(
    () => sanitizeArticleHTML(article?.content || ""),
    [article?.content]
  );

  const sections = article?.sections || [];

  const legacyTableOfContents = sections
    .map((section, index) => ({
      heading: section.heading,
      id: createSectionId(section.heading, index),
      index,
    }))
    .filter((section) => section.heading);

  const tableOfContents = isLegacyArticle
    ? legacyTableOfContents
    : articleContent.headings;

  const relatedArticles = recommendations.slice(0, 3);

  const readingTime =
    article?.readingTime || getReadingTime(article?.content);

  const coverImage =
    article?.coverMedia?.url ||
    article?.coverImage ||
    article?.coverImageUrl ||
    "";

  const publicationDate = formatDate(
    article?.publicationDate ||
    article?.publishedAt ||
    article?.createdAt
  );

  const handleShare = async () => {
    if (!article) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || "",
          url: window.location.href,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to share publication:", error);
        }
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Article link copied to clipboard.");
      } catch {
        alert("Unable to copy the article link.");
      }
    }
  };

  if (articleLoading && !article) {
    return (
      <main className="inner-page article-detail-page">
        <section className="article-not-found section-padding">
          <div className="container">
            <BookOpen size={42} />
            <span className="eyebrow">AGRIC X TRADING INSIGHTS</span>
            <h1>Loading publication...</h1>
            <p>Please wait while we retrieve this publication.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="inner-page article-detail-page">
        <section className="article-not-found section-padding">
          <div className="container">
            <BookOpen size={42} />
            <span className="eyebrow">AGRIC X TRADING INSIGHTS</span>

            <h1>
              {articleError
                ? "Unable to load publication"
                : "Publication not found"}
            </h1>

            <p>
              {articleError ||
                "This publication may have been moved or is not currently available."}
            </p>

            {articleError && (
              <button
                type="button"
                className="primary-button"
                onClick={retryArticle}
              >
                Try Again
              </button>
            )}

            <Link to="/insights" className="primary-button">
              <ArrowLeft size={17} />
              Back to Insights
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="inner-page article-detail-page">
      <section className="article-detail-section">
        <div className="container">
          <Link to="/insights" className="article-back-link">
            <ArrowLeft size={17} />
            <span>Back to Insights</span>
          </Link>

          <div className="article-layout">
            <article className="article-main">
              <header className="article-header">
                <div className="article-header-meta">
                  <span className="article-category">
                    {article.category || "Publication"}
                  </span>
                </div>

                <h1>{article.title}</h1>

                {article.excerpt && (
                  <p className="article-intro">{article.excerpt}</p>
                )}

                <div className="article-meta">
                  <span>
                    <BookOpen size={16} />
                    {article.author || "Agric X Trading"}
                  </span>

                  <span>
                    <Clock3 size={16} />
                    {readingTime}
                  </span>

                  {publicationDate && (
                    <span>{publicationDate}</span>
                  )}
                </div>

                {coverImage && (
                  <div className="article-cover">
                    <img src={coverImage} alt={article.title} />
                  </div>
                )}
              </header>

              <div className="article-content">
                {isLegacyArticle ? (
                  sections.map((section, index) => {
                    const sectionId = createSectionId(
                      section.heading,
                      index
                    );

                    if (section.type === "image") {
                      return (
                        <figure
                          className="article-inline-image"
                          key={`${section.type}-${index}`}
                        >
                          <img
                            src={section.image}
                            alt={
                              section.alt ||
                              section.caption ||
                              article.title
                            }
                            loading="lazy"
                          />

                          {section.caption && (
                            <figcaption>{section.caption}</figcaption>
                          )}
                        </figure>
                      );
                    }

                    if (section.type === "video") {
                      return (
                        <div
                          className="article-video-block"
                          id={sectionId}
                          key={`${section.type}-${index}`}
                        >
                          {section.heading && <h2>{section.heading}</h2>}

                          <video
                            src={section.videoUrl}
                            controls
                            preload="metadata"
                          />

                          {section.caption && (
                            <p className="article-video-caption">
                              {section.caption}
                            </p>
                          )}
                        </div>
                      );
                    }

                    if (section.type === "list") {
                      return (
                        <section
                          className="article-text-section"
                          id={sectionId}
                          key={`${section.type}-${index}`}
                        >
                          {section.heading && <h2>{section.heading}</h2>}

                          {section.content && <p>{section.content}</p>}

                          {Array.isArray(section.items) && (
                            <ul className="article-list">
                              {section.items.map((item, itemIndex) => (
                                <li key={itemIndex}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </section>
                      );
                    }

                    if (section.type === "quote") {
                      return (
                        <blockquote
                          className="article-quote"
                          id={sectionId}
                          key={`${section.type}-${index}`}
                        >
                          <p>{section.content}</p>

                          {section.attribution && (
                            <cite>{section.attribution}</cite>
                          )}
                        </blockquote>
                      );
                    }

                    return (
                      <section
                        className="article-text-section"
                        id={sectionId}
                        key={`${section.type}-${index}`}
                      >
                        {section.heading && <h2>{section.heading}</h2>}
                        {section.content && <p>{section.content}</p>}
                      </section>
                    );
                  })
                ) : (
                  <div
                    className="article-rich-content"
                    dangerouslySetInnerHTML={{
                      __html: articleContent.html,
                    }}
                  />
                )}
              </div>

              <div className="article-end">
                <div>
                  <span className="eyebrow">END OF PUBLICATION</span>
                  <h3>Thank you for reading.</h3>
                  <p>
                    Explore more agricultural knowledge and educational
                    resources from Agric X Trading.
                  </p>
                </div>

                <button
                  type="button"
                  className="article-share-button"
                  onClick={handleShare}
                >
                  <Share2 size={17} />
                  Share publication
                </button>
              </div>
            </article>

            <aside className="article-sidebar">
              <div className="article-sidebar-inner">
                <div className="article-sidebar-card">
                  <span className="article-sidebar-label">
                    IN THIS PUBLICATION
                  </span>

                  <h3>Table of contents</h3>

                  {tableOfContents.length > 0 ? (
                    <nav className="article-toc">
                      {tableOfContents.map((item, index) => (
                        <a href={`#${item.id}`} key={item.id}>
                          <span>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {item.heading}
                        </a>
                      ))}
                    </nav>
                  ) : (
                    <p className="article-sidebar-empty">
                      This publication has no section headings.
                    </p>
                  )}
                </div>

                <div className="article-sidebar-card related-sidebar-card">
                  <span className="article-sidebar-label">
                    KEEP EXPLORING
                  </span>

                  <h3>Recommended for you</h3>

                  {recommendationsLoading ? (
                    <p className="article-sidebar-empty">
                      Loading recommended resources...
                    </p>
                  ) : recommendations.length > 0 ? (
                    <div className="article-related-list">
                      {recommendations.map((resource) => (
                        <RecommendationCard
                          resource={resource}
                          key={`${resource.type}-${getResourceSlug(resource)}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="article-sidebar-empty">
                      More published resources will appear here as they
                      become available.
                    </p>
                  )}

                  <Link to="/insights" className="article-all-link">
                    Explore all insights <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="article-sidebar-cta">
                  <div className="article-cta-icon">
                    <Play size={19} />
                  </div>

                  <h3>Interested in agricultural knowledge?</h3>

                  <p>
                    Connect with Agric X Trading to learn more about our
                    services and areas of expertise.
                  </p>

                  <Link to="/contact">
                    Contact Us <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          <section className="article-bottom-related">
            <div className="article-bottom-heading">
              <div>
                <span className="eyebrow">MORE TO EXPLORE</span>
                <h2>Continue reading</h2>
              </div>

              <Link to="/insights">
                View all publications <ArrowRight size={16} />
              </Link>
            </div>

            <div className="article-bottom-grid">
              {relatedArticles.map((related) => {
                const image = getResourceImage(related);

                return (
                  <Link
                    to={getRecommendationLink(related)}
                    className="article-bottom-card"
                    key={`${related.type}-${getResourceSlug(related)}`}
                  >
                    <div className="article-bottom-image">
                      {image ? (
                        <img
                          src={image}
                          alt={getResourceTitle(related)}
                          loading="lazy"
                        />
                      ) : (
                        <span className="article-recommendation-placeholder">
                          {related.type === "video" ? (
                            <Play size={24} />
                          ) : (
                            <FileText size={24} />
                          )}
                        </span>
                      )}
                    </div>

                    <div className="article-bottom-card-content">
                      <span>
                        {getResourceCategory(
                          related,
                          related.type === "video" ? "Video" : "Publication"
                        )}
                      </span>

                      <h3>{getResourceTitle(related)}</h3>

                      <p>{getResourceDescription(related)}</p>

                      <strong>
                        {related.type === "video"
                          ? "Watch video"
                          : "Read publication"}
                        <ArrowUpRight size={15} />
                      </strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
