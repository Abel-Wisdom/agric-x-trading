import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  UserRound,
  Share2,
  Video,
  PlayCircle,
  BookOpen,
  FileText,
} from "lucide-react";

import {
  usePublicCollection,
  usePublicDetail,
} from "../hooks/usePublicData";

import "../styles/pages/VideoDetails.css";

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getResourceDate(resource) {
  return (
    resource.publicationDate ||
    resource.publishedAt ||
    resource.createdAt ||
    resource.updatedAt ||
    ""
  );
}

function getResourceDescription(resource) {
  const description =
    resource.excerpt ||
    resource.description ||
    "";

  return String(description)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getResourceImage(resource) {
  return resource.type === "video"
    ? resource.thumbnailMedia?.url || ""
    : resource.coverMedia?.url || resource.coverImage || "";
}

function getResourceLink(resource) {
  return resource.type === "video"
    ? `/insights/videos/${resource.slug}`
    : `/insights/${resource.slug}`;
}

function RecommendationCard({ resource }) {
  const image = getResourceImage(resource);
  const date = formatDate(getResourceDate(resource));
  const description = getResourceDescription(resource);

  const category =
    resource.type === "video"
      ? "Video"
      : resource.category || "Article";

  return (
    <article className="video-recommendation-item">
      <Link
        to={getResourceLink(resource)}
        className="video-recommendation-image"
        aria-label={`Open ${resource.title}`}
      >
        {image ? (
          <img
            src={image}
            alt={resource.title || "Agricultural resource"}
            loading="lazy"
          />
        ) : (
          <span className="video-recommendation-placeholder">
            {resource.type === "video" ? (
              <Video size={22} />
            ) : (
              <BookOpen size={22} />
            )}
          </span>
        )}

        {resource.type === "video" && (
          <span className="video-recommendation-play">
            <PlayCircle size={20} />
          </span>
        )}
      </Link>

      <div className="video-recommendation-content">
        <span className="video-recommendation-category">
          {resource.type === "video" ? (
            <Video size={12} />
          ) : resource.category === "Farming Guides" ? (
            <FileText size={12} />
          ) : (
            <BookOpen size={12} />
          )}
          {category}
        </span>

        <h4>
          <Link to={getResourceLink(resource)}>
            {resource.title}
          </Link>
        </h4>

        {description && <p>{description}</p>}

        <div className="video-recommendation-meta">
          {resource.type === "video" && resource.presenter && (
            <span>
              <UserRound size={12} />
              {resource.presenter}
            </span>
          )}

          {date && (
            <span>
              <CalendarDays size={12} />
              {date}
            </span>
          )}
        </div>

        <Link
          to={getResourceLink(resource)}
          className="video-recommendation-link"
        >
          {resource.type === "video" ? "Watch video" : "Read more"}
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export default function VideoDetails() {
  const { slug } = useParams();

  const {
    data: video,
    loading,
    error,
    retry,
  } = usePublicDetail("videos", slug);

  const {
    data: articles,
    loading: articlesLoading,
  } = usePublicCollection("articles");

  const {
    data: videos,
    loading: videosLoading,
  } = usePublicCollection("videos");

  const [shareMessage, setShareMessage] = useState("");

  const recommendationsLoading =
    articlesLoading || videosLoading;

  // Update the browser tab title.
  useEffect(() => {
    if (video?.title) {
      document.title = `${video.title} | Agric X Trading`;
    }

    return () => {
      document.title = "Agric X Trading";
    };
  }, [video]);

  // Build a mixed, date-sorted recommendation list.
  const recommendations = useMemo(() => {
    const writtenResources = (articles || [])
      .filter((article) => article.category !== "Videos")
      .map((article) => ({
        ...article,
        type: "article",
      }));

    const videoResources = (videos || []).map((item) => ({
      ...item,
      type: "video",
    }));

    return [...writtenResources, ...videoResources]
      .filter(
        (resource) =>
          resource.slug &&
          resource.slug !== slug
      )
      .sort((a, b) => {
        const dateA =
          new Date(getResourceDate(a)).getTime() || 0;
        const dateB =
          new Date(getResourceDate(b)).getTime() || 0;

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [articles, videos, slug]);

  // Share the current video page.
  const handleShare = async () => {
    const shareData = {
      title: video?.title || "Agric X Trading Video",
      text:
        video?.description ||
        "Watch this video from Agric X Trading.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareMessage("Link copied!");
        window.setTimeout(() => setShareMessage(""), 2500);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setShareMessage("Unable to share this video.");
        window.setTimeout(() => setShareMessage(""), 2500);
      }
    }
  };

  const videoUrl = video?.videoMedia?.url;
  const thumbnailUrl = video?.thumbnailMedia?.url;
  const publicationDate = formatDate(video?.publicationDate);

  if (loading && !video) {
    return (
      <main className="video-detail-page">
        <section className="video-detail-status container">
          <div className="video-detail-loader" />
          <p>Loading video...</p>
        </section>
      </main>
    );
  }

  if (error || !video) {
    return (
      <main className="video-detail-page">
        <section className="video-detail-status container">
          <Video size={42} />
          <span className="eyebrow">VIDEO UNAVAILABLE</span>
          <h1>We couldn't find this video</h1>
          <p>
            {error ||
              "The video may have been removed or is no longer available."}
          </p>

          {error && (
            <button
              type="button"
              className="video-detail-back-button"
              onClick={retry}
            >
              Try Again
            </button>
          )}

          <Link to="/insights" className="video-detail-back-button">
            <ArrowLeft size={16} />
            Back to Insights
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="video-detail-page">
      <section className="video-detail-section">
        <div className="container">
          <Link to="/insights" className="video-detail-back-link">
            <ArrowLeft size={16} />
            Back to Insights
          </Link>

          <div className="video-detail-layout">
            <article className="video-detail-main">
              <header className="video-detail-header">
                <div className="video-detail-header-meta">
                  <span className="video-detail-category">
                    <PlayCircle size={13} />
                    Video Guide
                  </span>
                  <span className="video-detail-type">
                    Agric X Trading
                  </span>
                </div>

                <h1>{video.title}</h1>

                {video.description && (
                  <p className="video-detail-intro">
                    {video.description}
                  </p>
                )}

                <div className="video-detail-meta">
                  {video.presenter && (
                    <span>
                      <UserRound size={15} />
                      {video.presenter}
                    </span>
                  )}

                  {publicationDate && (
                    <span>
                      <CalendarDays size={15} />
                      {publicationDate}
                    </span>
                  )}
                </div>
              </header>

              <div className="video-detail-player">
                {videoUrl ? (
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={thumbnailUrl || undefined}
                  >
                    <source src={videoUrl} />
                    Your browser does not support HTML video playback.
                    <a href={videoUrl}>Open the video file</a>
                  </video>
                ) : (
                  <div className="video-detail-player-error">
                    <Video size={38} />
                    <p>The video file is currently unavailable.</p>
                  </div>
                )}
              </div>

              <div className="video-detail-content">
                <div className="video-detail-content-heading">
                  <div>
                    <span className="eyebrow">ABOUT THIS VIDEO</span>
                    <h2>Video Overview</h2>
                  </div>

                  <button
                    type="button"
                    className="video-detail-share-button"
                    onClick={handleShare}
                  >
                    <Share2 size={15} />
                    Share
                  </button>
                </div>

                {shareMessage && (
                  <p className="video-detail-share-message" role="status">
                    {shareMessage}
                  </p>
                )}

                <p className="video-detail-description">
                  {video.description ||
                    "Explore this video guide from Agric X Trading."}
                </p>
              </div>

              <div className="video-detail-end">
                <div>
                  <span className="eyebrow">EXPLORE MORE</span>
                  <h3>Discover more agricultural insights</h3>
                  <p>
                    Explore our articles, farming guides, and other video
                    resources.
                  </p>
                </div>

                <Link to="/insights" className="video-detail-explore-link">
                  Explore Insights
                  <ArrowLeft
                    size={15}
                    className="video-detail-arrow-icon"
                  />
                </Link>
              </div>
            </article>

            <aside className="video-detail-sidebar">
              <section className="video-detail-sidebar-card video-recommendations">
                <div className="video-recommendations-heading">
                  <span className="video-detail-sidebar-label">
                    CONTINUE EXPLORING
                  </span>
                  <h3>Recommended for you</h3>
                  <p>
                    More publications, practical guides, and videos from
                    our knowledge library.
                  </p>
                </div>

                {recommendationsLoading ? (
                  <div className="video-recommendations-status">
                    <span className="video-detail-loader" />
                    <p>Finding more resources...</p>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="video-recommendations-list">
                    {recommendations.map((resource) => (
                      <RecommendationCard
                        key={`${resource.type}-${resource.id || resource.slug}`}
                        resource={resource}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="video-recommendations-empty">
                    <BookOpen size={24} />
                    <p>
                      More agricultural resources will appear here as
                      they are published.
                    </p>
                  </div>
                )}

                <Link
                  to="/insights"
                  className="video-recommendations-all-link"
                >
                  Browse all resources
                  <ArrowUpRight size={15} />
                </Link>
              </section>

              <div className="video-detail-sidebar-note">
                <span className="eyebrow">AGRIC X TRADING</span>
                <h3>Research. Knowledge. Growth.</h3>
                <p>
                  Supporting better agricultural decisions through
                  research, consultation, and practical learning.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
