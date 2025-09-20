"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function CommentSection() {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [author, setAuthor] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [nameError, setNameError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [clickedButton, setClickedButton] = useState(null);

  useEffect(() => {
    fetch("/api/comments")
      .then((res) => res.json())
      .then((data) => setComments(data || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameError("");
    setCommentError("");

    let hasError = false;
    if (!author.trim()) {
      setNameError("You must enter your name.");
      hasError = true;
    }
    if (!input.trim()) {
      setCommentError("You must enter a comment.");
      hasError = true;
    }
    if (hasError) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input, author, parentId: replyingTo }),
    });
    const newComment = await res.json();

    const addReply = (arr) =>
      arr.map((c) => {
        if (c.id === replyingTo) return { ...c, replies: [newComment, ...(c.replies || [])] };
        if (c.replies && c.replies.length > 0) return { ...c, replies: addReply(c.replies) };
        return c;
      });

    setComments((prev) => (replyingTo ? addReply(prev) : [newComment, ...prev]));
    setInput("");
    setReplyingTo(null);
  };

  const handleReaction = async (id, action) => {
    setClickedButton(id + action);
    const res = await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const updated = await res.json();
    setComments(updated);
    setTimeout(() => setClickedButton(null), 200);
  };

  const handleEdit = async (id, text) => {
    const res = await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "edit", text }),
    });
    const updated = await res.json();
    setComments(updated);
  };

  const handleDelete = async (id) => {
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, author }),
    });

    const removeComment = (arr) =>
      arr
        .filter((c) => !(c.id === id && c.author === author))
        .map((c) => ({ ...c, replies: removeComment(c.replies || []) }));

    setComments((prev) => removeComment(prev));
  };

  // timeAgo helper
  const timeAgo = (iso) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 5) return "just now";
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 3600);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 86400);
    if (d < 7) return `${d}d`;
    const w = Math.floor(d / 604800);
    if (w < 5) return `${w}w`;
    const mo = Math.floor(d / 2592000);
    if (mo < 12) return `${mo}mo`;
    const y = Math.floor(d / 31536000);
    return `${y}y`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Image src="/comment.svg" alt="Comments" width={24} height={24} />
        NEXT Comments System
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
        <div className="flex flex-col">
          <input
            type="text"
            placeholder="Your name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="border p-2 rounded text-black"
          />
          {nameError && <span className="text-red-600 text-sm mt-1">{nameError}</span>}
        </div>

        <div className="flex flex-col">
          <textarea
            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border p-2 rounded text-black"
          />
          {commentError && <span className="text-red-600 text-sm mt-1">{commentError}</span>}
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition">
            {replyingTo ? "Reply" : "Post"}
          </button>

          {replyingTo && (
            <button
              type="button"
              className="bg-gray-300 text-black py-1 px-3 rounded hover:bg-gray-400 transition"
              onClick={() => setReplyingTo(null)}
            >
              Cancel reply
            </button>
          )}
        </div>
      </form>

      <CommentList
        comments={comments}
        onReaction={handleReaction}
        onReply={(id) => setReplyingTo(id)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentAuthor={author}
        clickedButton={clickedButton}
        timeAgo={timeAgo}
      />
    </div>
  );
}

// ---------- CommentList ----------
function CommentList({ comments, onReaction, onReply, onEdit, onDelete, currentAuthor, clickedButton, timeAgo }) {
  const [collapsed, setCollapsed] = useState({});
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");

  const toggleCollapse = (id) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  if (!comments || comments.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {comments.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="border rounded p-3 bg-white shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black">
                  <strong>{c.author}</strong>{" "}
                  <span className="text-gray-500 text-xs ml-2">{timeAgo(c.createdAt)}</span>
                </p>
                {editing === c.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="border p-2 rounded text-black w-full"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={async () => {
                          await onEdit(c.id, editText);
                          setEditing(null);
                        }}
                        className="bg-green-500 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditing(null)} className="bg-gray-300 px-2 py-1 rounded">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-black mt-1">{c.text}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-2 text-sm">
              <motion.button
                onClick={() => onReaction(c.id, "like")}
                className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition"
                animate={clickedButton === c.id + "like" ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.18 }}
              >
                <Image src="/like.svg" alt="Like" width={16} height={16} />
                <span>{c.likes || 0}</span>
              </motion.button>

              <motion.button
                onClick={() => onReaction(c.id, "dislike")}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition"
                animate={clickedButton === c.id + "dislike" ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.18 }}
              >
                <Image src="/dislike.svg" alt="Dislike" width={16} height={16} />
                <span>{c.dislikes || 0}</span>
              </motion.button>

              <button
                onClick={() => onReply(c.id)}
                className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition"
              >
                <Image src="/reply.svg" alt="Reply" width={16} height={16} />
                Reply
              </button>

              {c.author === currentAuthor && (
                <>
                  <button
                    onClick={() => {
                      setEditing(c.id);
                      setEditText(c.text);
                    }}
                    className="flex items-center gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded transition"
                  >
                    <Image src="/edit.svg" alt="Edit" width={16} height={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(c.id)}
                    className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition"
                  >
                    <Image src="/delete.svg" alt="Delete" width={16} height={16} />
                    Delete
                  </button>
                </>
              )}
            </div>

            {c.replies?.length > 0 && (
              <div className="ml-6 mt-2">
                <button
                  onClick={() => toggleCollapse(c.id)}
                  className="text-xs text-blue-600 underline mb-1"
                >
                  {collapsed[c.id] ? `Show replies (${c.replies.length})` : `Hide replies (${c.replies.length})`}
                </button>

                {!collapsed[c.id] && (
                  <div className="border-l pl-3 space-y-2">
                    <CommentList
                      comments={c.replies}
                      onReaction={onReaction}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      currentAuthor={currentAuthor}
                      clickedButton={clickedButton}
                      timeAgo={timeAgo}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
