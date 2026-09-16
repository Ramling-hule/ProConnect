"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, FileText, File, Download, ExternalLink } from "lucide-react";
import { openAuthModal } from "@/redux/features/authSlice";
import { API_BASE_URL } from "@/utils/config";
function MediaRenderer({ post, isDark }) {
  const bgMuted = isDark ? "rgba(0,0,0,0.3)" : "#F0F4FF";
  const legacyImage = post.image && !post.media;
  if (legacyImage) {
    return (
      <div className="w-full overflow-hidden" style={{ background: bgMuted }}>
        <img
          src={post.image}
          alt="Post media"
          className="w-full h-auto max-h-[500px] object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  const media = post.media;
  if (!media?.url) return null;

  const { url, resourceType, format, originalFilename } = media;
  if (resourceType === "image") {
    return (
      <div className="w-full overflow-hidden" style={{ background: bgMuted }}>
        <img
          src={url}
          alt={originalFilename || "Post image"}
          className="w-full h-auto max-h-[500px] object-contain"
          loading="lazy"
        />
      </div>
    );
  }
  if (resourceType === "video") {
    return (
      <div className="w-full overflow-hidden rounded-b-none" style={{ background: "#000" }}>
        <video
          src={url}
          controls
          preload="metadata"
          className="w-full max-h-[500px]"
          style={{ display: "block" }}
        />
      </div>
    );
  }
  if (resourceType === "raw" && format === "pdf") {
    return (
      <div
        className="mx-5 my-3 rounded-xl overflow-hidden"
        style={{
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        <iframe
          src={`${url}#toolbar=0&navpanes=0`}
          title={originalFilename || "PDF"}
          className="w-full"
          style={{ height: 380, border: "none" }}
        />
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            background: isDark ? "#0C1323" : "#F8FAFF",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} style={{ color: "#F97316", flexShrink: 0 }} />
            <span
              className="text-xs font-semibold truncate"
              style={{ color: isDark ? "#E8EFF8" : "#0F172A" }}
            >
              {originalFilename || "document.pdf"}
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={originalFilename}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 flex-shrink-0 ml-3"
            style={{ color: "#F97316", background: "rgba(249,115,22,0.1)" }}
          >
            <Download size={13} />
            Download
          </a>
        </div>
      </div>
    );
  }
  if (resourceType === "raw" && (format === "txt" || format === "md" || format === "text")) {
    return (
      <TextFilePreview url={url} filename={originalFilename} isDark={isDark} />
    );
  }
  return (
    <div
      className="mx-5 my-3 flex items-center gap-3 p-4 rounded-xl"
      style={{
        background: isDark ? "#0C1323" : "#F8FAFF",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
      }}
    >
      <File size={24} style={{ color: "#A78BFA" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: isDark ? "#E8EFF8" : "#0F172A" }}>
          {originalFilename || "Attachment"}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
        style={{ color: "#4F8EF7", background: "rgba(79,142,247,0.1)" }}
      >
        <ExternalLink size={13} />
        Open
      </a>
    </div>
  );
}

function TextFilePreview({ url, filename, isDark }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then((t) => setContent(t))
      .catch(() => setContent("(Could not load file preview)"))
      .finally(() => setLoading(false));
  }, [url]);

  return (
    <div
      className="mx-5 my-3 rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
        background: isDark ? "#0C1323" : "#F8FAFF",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}
      >
        <div className="flex items-center gap-2">
          <File size={15} style={{ color: "#A78BFA" }} />
          <span className="text-xs font-semibold" style={{ color: isDark ? "#E8EFF8" : "#0F172A" }}>
            {filename || "text file"}
          </span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={filename}
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
          style={{ color: "#A78BFA", background: "rgba(167,139,250,0.1)" }}
        >
          <Download size={12} />
          Download
        </a>
      </div>
      <pre
        className="text-xs font-mono whitespace-pre-wrap p-4 max-h-48 overflow-auto"
        style={{ color: isDark ? "#B0BFDA" : "#334155" }}
      >
        {loading ? "Loading…" : (content?.slice(0, 1000) || "")}
        {!loading && content?.length > 1000 ? "\n… (truncated)" : ""}
      </pre>
    </div>
  );
}
const PostCard = ({ post, user, isDark }) => {
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isShareClicked, setIsShareClicked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dispatch = useDispatch();

  const handleToggleComments = () => {
    if (!user) {
      dispatch(openAuthModal("Please sign in to view or add comments."));
      return;
    }
    setShowComments(!showComments);
  };

  const handleToggleMenu = () => {
    if (!user) {
      dispatch(openAuthModal("Please sign in to view options."));
      return;
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const currentUserId = user?.id || user?._id;
  const isLiked = likes.some((id) => id?.toString() === currentUserId?.toString());
  const surface  = isDark ? "#0C1323" : "#FFFFFF";
  const border   = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const textPrimary   = isDark ? "#E8EFF8" : "#0F172A";
  const textSecondary = isDark ? "#6B7FA3" : "#64748B";
  const divider       = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const hoverBtn      = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const commentBg     = isDark ? "#060B18" : "#F8FAFF";

  const handleLike = async () => {
    if (!user) {
      dispatch(openAuthModal("Please sign in to like this post."));
      return;
    }
    if (isLiked) {
      setLikes(likes.filter((id) => id?.toString() !== currentUserId?.toString()));
    } else {
      setLikes([...likes, currentUserId]);
    }
    try {
      await fetch(`${API_BASE_URL}/api/dashboard/posts/${post._id}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      dispatch(openAuthModal("Please sign in to comment on this post."));
      return;
    }
    if (!commentText.trim()) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/dashboard/posts/${post._id}/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, text: commentText }),
        }
      );
      const updatedComments = await res.json();
      setComments(updatedComments);
      setCommentText("");
    } catch (err) {
      console.error("Comment failed", err);
    }
  };

  const handleShare = () => {
    if (!user) {
      dispatch(openAuthModal("Please sign in to share this post."));
      return;
    }
    setIsShareClicked(true);
    navigator.clipboard.writeText("Check out this post on ProConnect!");
    setTimeout(() => setIsShareClicked(false), 2000);
  };

  const initials = (name) => name?.[0]?.toUpperCase() || "U";

  return (
    <article
      className="rounded-2xl overflow-hidden transition-all duration-200 animate-fade-up"
      style={{
        background: surface,
        border: `1px solid ${border}`,
        boxShadow: isDark
          ? "0 1px 3px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3)"
          : "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      <div className="p-5 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4F8EF7, #818CF8)" }}
          >
            {initials(post.user?.name)}
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight" style={{ color: textPrimary }}>
              {post.user?.name || "Unknown User"}
            </h4>
            <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
              {post.user?.institute || "Institute"} ·{" "}
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={handleToggleMenu}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: textSecondary }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBtn)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
      {post.text && (
        <div
          className="px-5 pb-4 text-sm leading-7 whitespace-pre-wrap"
          style={{ color: isDark ? "#B0BFDA" : "#334155" }}
        >
          {post.text}
        </div>
      )}
      <MediaRenderer post={post} isDark={isDark} />
      <div
        className="px-5 py-2.5 flex justify-between text-xs font-medium"
        style={{ borderTop: `1px solid ${divider}`, color: textSecondary }}
      >
        <span>{likes.length > 0 ? `${likes.length} like${likes.length > 1 ? "s" : ""}` : "Be the first to like"}</span>
        <button
          onClick={handleToggleComments}
          className="transition-colors"
          style={{ color: textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#4F8EF7")}
          onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
        >
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </button>
      </div>
      <div
        className="px-3 py-2 grid grid-cols-3 gap-1"
        style={{ borderTop: `1px solid ${divider}` }}
      >
        <button
          onClick={handleLike}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            color: isLiked ? "#F87171" : textSecondary,
            background: isLiked
              ? "rgba(248,113,113,0.1)"
              : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!isLiked) e.currentTarget.style.background = hoverBtn;
          }}
          onMouseLeave={(e) => {
            if (!isLiked) e.currentTarget.style.background = "transparent";
          }}
        >
          <Heart size={16} className={isLiked ? "fill-current" : ""} />
          <span>Like</span>
        </button>
        <button
          onClick={handleToggleComments}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ color: textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBtn)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <MessageCircle size={16} />
          <span>Comment</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            color: isShareClicked ? "#34D399" : textSecondary,
            background: isShareClicked ? "rgba(52,211,153,0.08)" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!isShareClicked) e.currentTarget.style.background = hoverBtn;
          }}
          onMouseLeave={(e) => {
            if (!isShareClicked) e.currentTarget.style.background = "transparent";
          }}
        >
          <Share2 size={16} />
          <span>{isShareClicked ? "Copied!" : "Share"}</span>
        </button>
      </div>
      {showComments && (
        <div
          className="p-4"
          style={{ borderTop: `1px solid ${divider}`, background: commentBg }}
        >
          {comments.length > 0 && (
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#4F8EF7,#818CF8)" }}
                  >
                    {initials(c.user?.name)}
                  </div>
                  <div
                    className="flex-1 px-3 py-2 rounded-xl text-xs"
                    style={{
                      background: isDark ? "#141F35" : "#FFFFFF",
                      border: `1px solid ${border}`,
                    }}
                  >
                    <span className="font-bold block mb-0.5" style={{ color: textPrimary }}>
                      {c.user?.name || "User"}
                    </span>
                    <span style={{ color: isDark ? "#B0BFDA" : "#475569" }}>{c.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: isDark ? "#0D1526" : "#FFFFFF",
                border: `1px solid ${border}`,
                color: textPrimary,
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(79,142,247,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#4F8EF7,#818CF8)" }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
};
export default function Feed({ newPostTrigger }) {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);

  const observer = useRef();
  
  const fetchPosts = async (cursor = null, isRetry = false) => {
    if (!cursor) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE_URL}/api/dashboard/posts`);
      url.searchParams.append("limit", "10");
      if (cursor) url.searchParams.append("cursor", cursor);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch posts: ${res.status} ${text}`);
      }
      
      const data = await res.json();
      
      setPosts(prev => {
        if (!cursor) return data.posts || [];
        const newPosts = (data.posts || []).filter(
          newPost => !prev.some(p => p._id === newPost._id)
        );
        return [...prev, ...newPosts];
      });
      
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Fetch posts error:", err);
      setError("Unable to load posts. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (newPostTrigger) {
      setPosts((prev) => {
        if (prev.some(p => p._id === newPostTrigger._id)) return prev;
        return [newPostTrigger, ...prev];
      });
    }
  }, [newPostTrigger]);

  const lastPostElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !error) {
        fetchPosts(nextCursor);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, nextCursor, error]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 animate-pulse"
            style={{
              background: isDark ? "#0C1323" : "#FFFFFF",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
            }}
          >
            <div className="flex gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0"
                style={{ background: isDark ? "#141F35" : "#E2E8F0" }}
              />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-lg w-32" style={{ background: isDark ? "#141F35" : "#E2E8F0" }} />
                <div className="h-2.5 rounded-lg w-20" style={{ background: isDark ? "#141F35" : "#E2E8F0" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 rounded-lg" style={{ background: isDark ? "#141F35" : "#E2E8F0" }} />
              <div className="h-3 rounded-lg w-3/4" style={{ background: isDark ? "#141F35" : "#E2E8F0" }} />
              <div className="h-3 rounded-lg w-1/2" style={{ background: isDark ? "#141F35" : "#E2E8F0" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0 && !error) {
    return (
      <div
        className="rounded-2xl p-12 text-center"
        style={{
          background: isDark ? "#0C1323" : "#FFFFFF",
          border: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        }}
      >
        <p className="text-sm font-medium" style={{ color: isDark ? "#6B7FA3" : "#94A3B8" }}>
          No posts yet. Be the first to share something!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {posts.map((post, index) => {
        const isLast = index === posts.length - 1;
        return (
          <div key={post._id} ref={isLast ? lastPostElementRef : null}>
            <PostCard post={post} user={user} isDark={isDark} />
          </div>
        );
      })}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" 
               style={{ borderColor: "rgba(79,142,247,0.3)", borderTopColor: "#4F8EF7" }} />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
          <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>
          <button 
            onClick={() => fetchPosts(nextCursor, true)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#4F8EF7,#818CF8)" }}
          >
            Retry
          </button>
        </div>
      )}
      
      {!hasMore && posts.length > 0 && !error && (
        <div className="py-6 text-center">
          <p className="text-xs font-medium" style={{ color: isDark ? "#6B7FA3" : "#94A3B8" }}>
            You've reached the end of your feed.
          </p>
        </div>
      )}
    </div>
  );
}
