
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  ImagePlus,
  Video,
  Code,
  Eye,
  Upload,
  LoaderCircle,
} from "lucide-react";
import { clearAdminDataCache } from "../services/adminDataCache";
import "../styles/ResearchEditor.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "");

const TOKEN_KEY = "agric_admin_token";
const ADMIN_KEY = "agric_admin";

// Clear the current admin session when the backend rejects authentication.
const handleUnauthorized = () => {
  clearAdminDataCache();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  window.location.replace("/admin/login");
};

// Handle authentication errors and unsuccessful API responses consistently.
const readResponse = async (response) => {
  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
    throw new Error("Your admin session has expired. Please log in again.");
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Unable to upload the selected files."
    );
  }

  return result;
};

// VNS 1: CUSTOM IMAGE NODE WITH CAPTIONS AND MEDIA RELATIONSHIPS
const ResearchImage = Node.create({
  name: "researchImage",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: {
        default: "",
        renderHTML: () => ({}),
      },
      mediaId: {
        default: null,
        parseHTML: (element) =>
          Number(element.getAttribute("data-media-id")) || null,
        renderHTML: (attributes) =>
          attributes.mediaId
            ? { "data-media-id": attributes.mediaId }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "figure[data-research-image]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...attributes } = HTMLAttributes;

    return [
      "figure",
      mergeAttributes(attributes, {
        "data-research-image": "true",
        "data-media-type": "image",
      }),
      ["img", { src: attributes.src, alt: attributes.alt || "" }],
      ["figcaption", {}, caption || ""],
    ];
  },
});

// VNS 2: CUSTOM UPLOADED VIDEO NODE WITH CAPTIONS
const ResearchVideo = Node.create({
  name: "researchVideo",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "" },
      caption: {
        default: "",
        renderHTML: () => ({}),
      },
      mediaId: {
        default: null,
        parseHTML: (element) =>
          Number(element.getAttribute("data-media-id")) || null,
        renderHTML: (attributes) =>
          attributes.mediaId
            ? { "data-media-id": attributes.mediaId }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "figure[data-research-video]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...attributes } = HTMLAttributes;

    return [
      "figure",
      mergeAttributes(attributes, {
        "data-research-video": "true",
        "data-media-type": "video",
      }),
      [
        "video",
        {
          src: attributes.src,
          controls: "true",
          preload: "metadata",
        },
      ],
      ["figcaption", {}, caption || ""],
    ];
  },
});

// VNS 3: CUSTOM EXTERNAL VIDEO EMBED NODE
const ResearchVideoEmbed = Node.create({
  name: "researchVideoEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "External video" },
    };
  },

  parseHTML() {
    return [{ tag: "figure[data-research-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-research-embed": "true",
      }),
      [
        "iframe",
        {
          src: HTMLAttributes.src,
          title: HTMLAttributes.title || "External video",
          loading: "lazy",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowfullscreen: "true",
          referrerpolicy: "strict-origin-when-cross-origin",
        },
      ],
    ];
  },
});

// VNS 4: CONVERT SUPPORTED VIDEO LINKS TO EMBED URLS
const getVideoEmbedUrl = (value) => {
  try {
    const url = new URL(value.trim());

    const youtubeId =
      url.hostname.includes("youtu.be")
        ? url.pathname.slice(1)
        : url.searchParams.get("v") ||
          url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];

    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(
        url.hostname
      ) &&
      youtubeId &&
      /^[a-zA-Z0-9_-]{11}$/.test(youtubeId)
    ) {
      return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
    }

    const vimeoId = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];

    if (
      ["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(
        url.hostname
      ) &&
      vimeoId
    ) {
      return `https://player.vimeo.com/video/${vimeoId}`;
    }

    return null;
  } catch {
    return null;
  }
};

// VNS 5: READ UPLOADED MEDIA REFERENCES FROM THE EDITOR HTML
const extractMediaItems = (html) => {
  if (typeof window === "undefined") return [];

  const document = new DOMParser().parseFromString(html || "", "text/html");

  return Array.from(
    document.querySelectorAll(
      "[data-media-id][data-media-type='image'], [data-media-id][data-media-type='video']"
    )
  )
    .map((element, index) => ({
      mediaAssetId: Number(element.getAttribute("data-media-id")),
      mediaType: element.getAttribute("data-media-type"),
      caption: element.querySelector("figcaption")?.textContent?.trim() || "",
      sortOrder: index,
    }))
    .filter(
      (item) =>
        Number.isInteger(item.mediaAssetId) &&
        item.mediaAssetId > 0
    );
};

// VNS 6: RESEARCH EDITOR COMPONENT
export default function ResearchEditor({
  content = "",
  onChange,
  onMediaChange,
}) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const htmlModeRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const onMediaChangeRef = useRef(onMediaChange);

  const [editorMode, setEditorMode] = useState("visual");
  const [htmlContent, setHtmlContent] = useState(content || "");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
    onMediaChangeRef.current = onMediaChange;
  }, [onChange, onMediaChange]);

  // VNS 7: INITIALIZE TIPTAP
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
      }),
      ResearchImage,
      ResearchVideo,
      ResearchVideoEmbed,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "research-editor-canvas",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();

      setHtmlContent(html);
      onChangeRef.current?.(html);
      onMediaChangeRef.current?.(extractMediaItems(html));
    },
  });

  // VNS 8: KEEP EDITOR CONTENT SYNCHRONIZED WITH THE FORM
  useEffect(() => {
    if (!editor || htmlModeRef.current) return;

    const currentContent = editor.getHTML();

    if (content !== currentContent) {
      editor.commands.setContent(content || "", {
        emitUpdate: false,
      });
    }
  }, [content, editor]);

  // VNS 9: UPLOAD INLINE MEDIA TO CLOUDINARY
  const uploadContentFiles = useCallback(
    async (files, mediaType) => {
      if (!files.length || !editor) return;

      const maximum = mediaType === "image" ? 10 : 5;

      if (files.length > maximum) {
        setError(
          `You can upload a maximum of ${maximum} ${mediaType} files at a time.`
        );
        return;
      }

      setUploading(true);
      setError("");
      setSuccess("");

      try {
        const formData = new FormData();
        const fieldName =
          mediaType === "image" ? "contentImages" : "contentVideos";

        files.forEach((file) => {
          formData.append(fieldName, file);
        });

        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
          handleUnauthorized();
          throw new Error("Your admin session has expired. Please log in again.");
        }

        const response = await fetch(`${API_URL}/research/upload-files`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await readResponse(response);

        const uploadedFiles =
          mediaType === "image" ? result.images : result.videos;

        if (!uploadedFiles?.length) {
          throw new Error("The upload completed without returning media files.");
        }

        const nodes = uploadedFiles.map((media) => ({
          type:
            mediaType === "image" ? "researchImage" : "researchVideo",
          attrs: {
            src: media.url,
            alt: media.originalName || "",
            title: media.originalName || "",
            caption: "",
            mediaId: media.id,
          },
        }));

        editor.chain().focus().insertContent(nodes).run();

        setSuccess(
          `${uploadedFiles.length} ${mediaType} file(s) uploaded and inserted.`
        );
      } catch (uploadError) {
        setError(uploadError.message || "Media upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  // VNS 10: INSERT AN EXTERNAL VIDEO
  const handleExternalVideo = () => {
    if (!editor || !videoUrl.trim()) return;

    const embedUrl = getVideoEmbedUrl(videoUrl);

    if (!embedUrl) {
      setError("Enter a valid YouTube or Vimeo video link.");
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "researchVideoEmbed",
        attrs: {
          src: embedUrl,
          title: "Research video",
        },
      })
      .run();

    setVideoUrl("");
    setError("");
    setSuccess("External video inserted.");
  };

  // VNS 11: SWITCH BETWEEN VISUAL AND HTML EDITING
  const switchEditorMode = (mode) => {
    if (!editor || mode === editorMode) return;

    if (mode === "html") {
      const html = editor.getHTML();
      setHtmlContent(html);
      setEditorMode("html");
      htmlModeRef.current = true;
      return;
    }

    editor.commands.setContent(htmlContent || "");
    setEditorMode("visual");
    htmlModeRef.current = false;

    onChangeRef.current?.(editor.getHTML());
    onMediaChangeRef.current?.(extractMediaItems(editor.getHTML()));
  };

  const updateHtmlContent = (value) => {
    setHtmlContent(value);
    onChangeRef.current?.(value);
  };

  // VNS 12: INSERT A LINK
  const insertLink = () => {
    if (!editor) return;

    const value = window.prompt("Enter the link URL:");

    if (!value?.trim()) return;

    let url = value.trim();

    if (!/^(https?:\/\/|mailto:)/i.test(url)) {
      url = `https://${url}`;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  if (!editor) {
    return (
      <div className="research-editor-loading">
        <LoaderCircle size={20} className="research-editor-spinner" />
        Loading research editor...
      </div>
    );
  }

  return (
    <div className="research-editor">
      <div className="research-editor-header">
        <div>
          <h3>Research Content</h3>
          <p>
            Write your report and insert images, videos, captions and links
            wherever they are relevant.
          </p>
        </div>

        <div className="research-editor-mode">
          <button
            type="button"
            className={editorMode === "visual" ? "active" : ""}
            onClick={() => switchEditorMode("visual")}
          >
            <Eye size={15} />
            Visual
          </button>

          <button
            type="button"
            className={editorMode === "html" ? "active" : ""}
            onClick={() => switchEditorMode("html")}
          >
            <Code size={15} />
            HTML
          </button>
        </div>
      </div>

      {editorMode === "visual" && (
        <>
          <div className="research-editor-toolbar">
            <button
              type="button"
              title="Bold"
              className={editor.isActive("bold") ? "active" : ""}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold size={17} />
            </button>

            <button
              type="button"
              title="Italic"
              className={editor.isActive("italic") ? "active" : ""}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={17} />
            </button>

            <button
              type="button"
              title="Underline"
              className={editor.isActive("underline") ? "active" : ""}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon size={17} />
            </button>

            <span className="research-toolbar-divider" />

            <button
              type="button"
              title="Heading 1"
              className={
                editor.isActive("heading", { level: 1 }) ? "active" : ""
              }
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 size={18} />
            </button>

            <button
              type="button"
              title="Heading 2"
              className={
                editor.isActive("heading", { level: 2 }) ? "active" : ""
              }
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 size={18} />
            </button>

            <button
              type="button"
              title="Heading 3"
              className={
                editor.isActive("heading", { level: 3 }) ? "active" : ""
              }
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 size={18} />
            </button>

            <span className="research-toolbar-divider" />

            <button
              type="button"
              title="Bullet list"
              className={editor.isActive("bulletList") ? "active" : ""}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List size={18} />
            </button>

            <button
              type="button"
              title="Numbered list"
              className={editor.isActive("orderedList") ? "active" : ""}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered size={18} />
            </button>

            <button
              type="button"
              title="Blockquote"
              className={editor.isActive("blockquote") ? "active" : ""}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote size={17} />
            </button>

            <button
              type="button"
              title="Insert link"
              className={editor.isActive("link") ? "active" : ""}
              onClick={insertLink}
            >
              <LinkIcon size={17} />
            </button>

            <span className="research-toolbar-divider" />

            <button
              type="button"
              title="Upload images"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
            >
              <ImagePlus size={18} />
              <span>Images</span>
            </button>

            <button
              type="button"
              title="Upload videos"
              disabled={uploading}
              onClick={() => videoInputRef.current?.click()}
            >
              <Video size={18} />
              <span>Upload Video</span>
            </button>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={(event) => {
              uploadContentFiles(
                Array.from(event.target.files || []),
                "image"
              );
              event.target.value = "";
            }}
          />

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            multiple
            hidden
            onChange={(event) => {
              uploadContentFiles(
                Array.from(event.target.files || []),
                "video"
              );
              event.target.value = "";
            }}
          />

          <EditorContent editor={editor} />

          <div className="research-external-video">
            <div className="research-external-video-heading">
              <Video size={17} />
              <strong>Optional: Embed a YouTube or Vimeo Video Link</strong>
            </div>

            <div className="research-external-video-input">
              <input
                type="url"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="Paste a YouTube or Vimeo URL"
              />

              <button
                type="button"
                onClick={handleExternalVideo}
                disabled={!videoUrl.trim()}
              >
                Embed Link
              </button>
            </div>
          </div>
        </>
      )}

      {editorMode === "html" && (
        <textarea
          className="research-html-editor"
          value={htmlContent}
          onChange={(event) => updateHtmlContent(event.target.value)}
          spellCheck="false"
          placeholder="Edit the report HTML..."
        />
      )}

      {uploading && (
        <div className="research-editor-feedback uploading">
          <LoaderCircle size={17} className="research-editor-spinner" />
          Uploading media to permanent storage...
        </div>
      )}

      {error && (
        <div className="research-editor-feedback error">
          {error}
        </div>
      )}

      {success && !uploading && (
        <div className="research-editor-feedback success">
          <Upload size={15} />
          {success}
        </div>
      )}

      <div className="research-editor-footer">
        <span>
          Images and uploaded videos are saved to permanent Cloudinary
          storage.
        </span>
        <span>Supported external videos: YouTube and Vimeo</span>
      </div>
    </div>
  );
}
