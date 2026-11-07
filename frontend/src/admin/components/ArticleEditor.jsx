
import { useCallback, useEffect, useRef, useState } from "react";
import { Node } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { clearAdminDataCache } from "../services/adminDataCache";
import "../styles/ArticleEditor.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "");

const TOKEN_KEY = "agric_admin_token";
const ADMIN_KEY = "agric_admin";

// Handle expired or unauthorized administrator sessions.
function handleUnauthorized() {
  clearAdminDataCache();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  window.location.replace("/admin/login");
}

// Parse API responses and handle authentication errors.
async function readResponse(response, fallbackMessage) {
  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
    throw new Error(
      "Your admin session has expired. Please log in again."
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || fallbackMessage
    );
  }

  return result;
}

// IMAGE NODE WITH OPTIONAL CAPTION
const CaptionedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-article-image]",
        getAttrs: (element) => {
          const img = element.querySelector("img");
          if (!img) return false;

          return {
            src: img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "",
            title: img.getAttribute("title") || "",
            width: img.getAttribute("width"),
            height: img.getAttribute("height"),
            caption:
              element.querySelector("figcaption")?.textContent || "",
          };
        },
      },
      { tag: "img[src]" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...imageAttributes } = HTMLAttributes;

    return [
      "figure",
      {
        "data-article-image": "true",
        class: "article-inline-image",
      },
      ["img", imageAttributes],
      ...(caption ? [["figcaption", {}, caption]] : []),
    ];
  },
});

// CUSTOM VIDEO NODE WITH OPTIONAL CAPTION
const VideoNode = Node.create({
  name: "articleVideo",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-article-video]",
        getAttrs: (element) => {
          const video = element.querySelector("video");

          return {
            src: video?.getAttribute("src") || "",
            caption:
              element.querySelector("figcaption")?.textContent || "",
          };
        },
      },
      {
        tag: "video[src]",
        getAttrs: (element) => ({
          src: element.getAttribute("src"),
          caption: "",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, caption } = HTMLAttributes;

    return [
      "figure",
      {
        "data-article-video": "true",
        class: "article-video-block",
      },
      [
        "video",
        {
          src,
          controls: "controls",
          preload: "metadata",
        },
      ],
      ...(caption ? [["figcaption", {}, caption]] : []),
    ];
  },
});

// ARTICLE EDITOR COMPONENT
export default function ArticleEditor({ content = "", onChange }) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [editorMode, setEditorMode] = useState("visual");
  const [htmlSource, setHtmlSource] = useState(content || "");
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // MEDIA CAPTION STATE
  const [pendingMedia, setPendingMedia] = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [editingCaption, setEditingCaption] = useState(false);

  // UPLOAD MEDIA TO THE EXISTING MEDIA LIBRARY
  const uploadMedia = useCallback(async (file) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      handleUnauthorized();
      throw new Error(
        "Your admin session has expired. Please log in again."
      );
    }

    const formData = new FormData();
    formData.append("files", file);

    const response = await fetch(`${API_URL}/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await readResponse(
      response,
      "Media upload failed. Please try again."
    );

    const media = result.media?.[0];

    if (!media?.url) {
      throw new Error("The server did not return a valid media URL.");
    }

    return media;
  }, []);

  // TIPTAP EDITOR CONFIGURATION
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CaptionedImage.configure({
        allowBase64: false,
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      VideoNode,
    ],

    content: content || "",

    editorProps: {
      attributes: {
        class: "article-editor-content",
      },
    },

    onUpdate: ({ editor: currentEditor }) => {
      const updatedHTML = currentEditor.getHTML();
      setHtmlSource(updatedHTML);

      if (onChange) onChange(updatedHTML);
    },
  });

  // KEEP THE EDITOR SYNCHRONIZED WITH THE PARENT FORM
  useEffect(() => {
    if (!editor) return;

    const incomingContent = content || "";

    if (incomingContent !== editor.getHTML()) {
      editor.commands.setContent(incomingContent, {
        emitUpdate: false,
      });
    }
  }, [content, editor]);

  // IMAGE UPLOAD
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !editor) return;

    if (!file.type.startsWith("image/")) {
      setUploadMessage("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      const media = await uploadMedia(file);

      setPendingMedia({
        type: "image",
        src: media.url,
        alt: media.originalName || file.name,
      });

      setCaptionDraft("");
      setEditingCaption(false);
      setShowLinkInput(false);
      setUploadMessage("Image uploaded. Add an optional caption below.");
    } catch (error) {
      setUploadMessage(error.message || "Unable to upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // VIDEO UPLOAD
  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !editor) return;

    if (!file.type.startsWith("video/")) {
      setUploadMessage("Please select a valid video file.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      const media = await uploadMedia(file);

      setPendingMedia({
        type: "video",
        src: media.url,
      });

      setCaptionDraft("");
      setEditingCaption(false);
      setShowLinkInput(false);
      setUploadMessage("Video uploaded. Add an optional caption below.");
    } catch (error) {
      setUploadMessage(error.message || "Unable to upload video.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // INSERT UPLOADED MEDIA WITH ITS CAPTION
  const handleInsertMedia = () => {
    if (!editor || !pendingMedia) return;

    const caption = captionDraft.trim();

    if (pendingMedia.type === "image") {
      editor
        .chain()
        .focus()
        .setImage({
          src: pendingMedia.src,
          alt: pendingMedia.alt,
          caption,
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "articleVideo",
          attrs: {
            src: pendingMedia.src,
            caption,
          },
        })
        .run();
    }

    setPendingMedia(null);
    setCaptionDraft("");
    setUploadMessage(
      caption
        ? "Media and caption added to the article."
        : "Media added to the article."
    );
  };

  // EDIT AN EXISTING MEDIA CAPTION
  const handleOpenCaptionEditor = () => {
    if (!editor) return;

    const selectedType = editor.isActive("image")
      ? "image"
      : editor.isActive("articleVideo")
        ? "articleVideo"
        : null;

    if (!selectedType) return;

    const attributes = editor.getAttributes(selectedType);

    setCaptionDraft(attributes.caption || "");
    setEditingCaption(true);
    setPendingMedia(null);
    setShowLinkInput(false);
    setUploadMessage("");
  };

  const handleSaveCaption = () => {
    if (!editor) return;

    const selectedType = editor.isActive("image")
      ? "image"
      : editor.isActive("articleVideo")
        ? "articleVideo"
        : null;

    if (!selectedType) {
      setEditingCaption(false);
      return;
    }

    editor
      .chain()
      .focus()
      .updateAttributes(selectedType, {
        caption: captionDraft.trim(),
      })
      .run();

    setEditingCaption(false);
    setCaptionDraft("");
    setUploadMessage("Media caption updated successfully.");
  };

  // LINK MANAGEMENT
  const handleAddLink = () => {
    if (!editor) return;

    const trimmedLink = linkInput.trim();

    if (!trimmedLink) {
      setShowLinkInput(false);
      return;
    }

    let finalLink = trimmedLink;

    if (!/^https?:\/\//i.test(finalLink)) {
      finalLink = `https://${finalLink}`;
    }

    try {
      new URL(finalLink);

      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: finalLink })
        .run();

      setLinkInput("");
      setShowLinkInput(false);
    } catch {
      setUploadMessage("Please enter a valid link.");
    }
  };

  const handleRemoveLink = () => {
    editor?.chain().focus().unsetLink().run();
    setLinkInput("");
    setShowLinkInput(false);
  };

  // SWITCH BETWEEN VISUAL AND HTML MODES
  const switchToHTML = () => {
    if (!editor) return;

    setHtmlSource(editor.getHTML());
    setEditorMode("html");
    setPendingMedia(null);
    setEditingCaption(false);
    setShowLinkInput(false);
  };

  const switchToVisual = () => {
    if (!editor) return;

    editor.commands.setContent(htmlSource || "", {
      emitUpdate: false,
    });

    if (onChange) onChange(htmlSource || "");

    setEditorMode("visual");
  };

  const handleHTMLChange = (event) => {
    const value = event.target.value;
    setHtmlSource(value);

    if (onChange) onChange(value);
  };

  // FORMATTING BUTTON
  const toolbarButton = (label, action, isActive = false, title = label) => (
    <button
      type="button"
      className={`article-toolbar-btn ${isActive ? "is-active" : ""}`}
      onClick={action}
      title={title}
      disabled={!editor || uploading}
    >
      {label}
    </button>
  );

  if (!editor) {
    return (
      <div className="article-editor-wrapper">
        <div className="article-editor-canvas">
          Loading article editor...
        </div>
      </div>
    );
  }

  const hasSelectedMedia =
    editor.isActive("image") || editor.isActive("articleVideo");

  // EDITOR INTERFACE
  return (
    <div className="article-editor-wrapper">
      <div className="article-editor-mode-bar">
        <div className="article-editor-mode-tabs">
          <button
            type="button"
            className={editorMode === "visual" ? "active" : ""}
            onClick={switchToVisual}
          >
            Visual Editor
          </button>

          <button
            type="button"
            className={editorMode === "html" ? "active" : ""}
            onClick={switchToHTML}
          >
            HTML Source
          </button>
        </div>

        <span className="article-editor-mode-description">
          {editorMode === "visual"
            ? "Format your article using the editor tools."
            : "Edit the article HTML directly."}
        </span>
      </div>

      {editorMode === "visual" && (
        <>
          {/* STICKY TOOLBAR AND TEMPORARY MEDIA PANELS */}
          <div className="article-editor-sticky-area">
            <div className="article-editor-toolbar">
              <div className="article-toolbar-group">
                {toolbarButton(
                  "B",
                  () => editor.chain().focus().toggleBold().run(),
                  editor.isActive("bold"),
                  "Bold"
                )}

                {toolbarButton(
                  "I",
                  () => editor.chain().focus().toggleItalic().run(),
                  editor.isActive("italic"),
                  "Italic"
                )}

                {toolbarButton(
                  "U",
                  () => editor.chain().focus().toggleUnderline().run(),
                  editor.isActive("underline"),
                  "Underline"
                )}
              </div>

              <span className="article-toolbar-divider" />

              <div className="article-toolbar-group">
                {toolbarButton(
                  "H1",
                  () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
                  editor.isActive("heading", { level: 1 }),
                  "Heading 1"
                )}

                {toolbarButton(
                  "H2",
                  () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                  editor.isActive("heading", { level: 2 }),
                  "Heading 2"
                )}

                {toolbarButton(
                  "H3",
                  () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                  editor.isActive("heading", { level: 3 }),
                  "Heading 3"
                )}
              </div>

              <span className="article-toolbar-divider" />

              <div className="article-toolbar-group">
                {toolbarButton(
                  "• List",
                  () => editor.chain().focus().toggleBulletList().run(),
                  editor.isActive("bulletList"),
                  "Bullet list"
                )}

                {toolbarButton(
                  "1. List",
                  () => editor.chain().focus().toggleOrderedList().run(),
                  editor.isActive("orderedList"),
                  "Numbered list"
                )}

                {toolbarButton(
                  "Quote",
                  () => editor.chain().focus().toggleBlockquote().run(),
                  editor.isActive("blockquote"),
                  "Blockquote"
                )}
              </div>

              <span className="article-toolbar-divider" />

              <div className="article-toolbar-group">
                <button
                  type="button"
                  className={`article-toolbar-btn ${
                    editor.isActive("link") ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setShowLinkInput((previous) => !previous);
                    setUploadMessage("");
                    setPendingMedia(null);
                    setEditingCaption(false);
                  }}
                  disabled={uploading}
                  title="Add link"
                >
                  Link
                </button>

                {editor.isActive("link") && (
                  <button
                    type="button"
                    className="article-toolbar-btn"
                    onClick={handleRemoveLink}
                    title="Remove link"
                  >
                    Unlink
                  </button>
                )}
              </div>

              <span className="article-toolbar-divider" />

              <div className="article-toolbar-group">
                <button
                  type="button"
                  className="article-editor-upload"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "+ Image"}
                </button>

                <button
                  type="button"
                  className="article-editor-upload"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "+ Video"}
                </button>

                <button
                  type="button"
                  className="article-toolbar-btn"
                  onClick={handleOpenCaptionEditor}
                  disabled={!hasSelectedMedia || uploading}
                  title="Edit selected image or video caption"
                >
                  Edit Caption
                </button>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleImageUpload}
              />

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                hidden
                onChange={handleVideoUpload}
              />
            </div>

            {/* LINK INPUT */}
            {showLinkInput && (
              <div className="article-editor-link-input">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkInput}
                  onChange={(event) => setLinkInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddLink();
                    }
                  }}
                />

                <button type="button" onClick={handleAddLink}>
                  Add Link
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkInput("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* NEW MEDIA CAPTION PANEL */}
            {pendingMedia && (
              <div className="article-media-caption-panel">
                <strong>
                  {pendingMedia.type === "image"
                    ? "Image uploaded"
                    : "Video uploaded"}
                </strong>

                <p>
                  Add a caption if you want to provide more context.
                  This field is optional.
                </p>

                <label htmlFor="new-media-caption">
                  Media caption (optional)
                </label>

                <textarea
                  id="new-media-caption"
                  value={captionDraft}
                  onChange={(event) => setCaptionDraft(event.target.value)}
                  placeholder="Describe this image or video..."
                  rows={3}
                />

                <div className="article-media-caption-actions">
                  <button type="button" onClick={handleInsertMedia}>
                    Insert {pendingMedia.type === "image" ? "Image" : "Video"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingMedia(null);
                      setCaptionDraft("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* EXISTING MEDIA CAPTION PANEL */}
            {editingCaption && (
              <div className="article-media-caption-panel">
                <strong>Edit media caption</strong>

                <p>
                  Update the caption or leave this field empty to remove it.
                </p>

                <label htmlFor="edit-media-caption">
                  Media caption (optional)
                </label>

                <textarea
                  id="edit-media-caption"
                  value={captionDraft}
                  onChange={(event) => setCaptionDraft(event.target.value)}
                  placeholder="Describe this image or video..."
                  rows={3}
                />

                <div className="article-media-caption-actions">
                  <button type="button" onClick={handleSaveCaption}>
                    Save Caption
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCaption(false);
                      setCaptionDraft("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ARTICLE WRITING AREA */}
          <div className="article-editor-canvas">
            <EditorContent editor={editor} />
          </div>
        </>
      )}

      {editorMode === "html" && (
        <textarea
          className="article-editor-html"
          value={htmlSource}
          onChange={handleHTMLChange}
          spellCheck={false}
          aria-label="Article HTML source"
        />
      )}

      {uploadMessage && (
        <div
          className="article-editor-footer"
          role="status"
          aria-live="polite"
        >
          <span>{uploadMessage}</span>
        </div>
      )}

      <div className="article-editor-footer">
        <span>
          {editorMode === "visual"
            ? "Images and videos are uploaded to permanent media storage. Captions are optional."
            : "HTML source editing mode."}
        </span>

        <span>
          {uploading
            ? "Uploading media..."
            : "Changes are saved with the article."}
        </span>
      </div>
    </div>
  );
}
