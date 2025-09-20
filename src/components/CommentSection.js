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
      .then(setComments);
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

    // Recursive function to add reply anywhere in nested comments
    const addReply = (arr) =>
      arr.map((c) => {
        if (c.id === replyingTo) return { ...c, replies: [...c.replies, newComment] };
        if (c.replies.length > 0) return { ...c, replies: addReply(c.replies) };
        return c;
      });

    setComments((prev) => (replyingTo ? addReply(prev) : [...prev, newComment]));

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

  const handleDelete = async (id) => {
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, author }),
    });

    const removeComment = (arr) =>
      arr
        .filter((c) => !(c.id === id && c.author === author))
        .map((c) => ({ ...c, replies: removeComment(c.replies) }));

    setComments((prev) => removeComment(prev));
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

        <button
          type="submit"
          className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition"
        >
          {replyingTo ? "Reply" : "Post"}
        </button>

        {replyingTo && (
          <button
            type="button"
            className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition"
            onClick={() => setReplyingTo(null)}
          >
            Cancel reply
          </button>
        )}
      </form>

      <CommentList
        comments={comments}
        onReaction={handleReaction}
        onReply={(id) => setReplyingTo(id)}
        onDelete={handleDelete}
        currentAuthor={author}
        clickedButton={clickedButton}
      />
    </div>
  );
}

function CommentList({ comments, onReaction, onReply, onDelete, currentAuthor, clickedButton }) {
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
            <p className="text-black">
              <strong>{c.author}</strong>: {c.text}
            </p>

            <div className="flex gap-2 mt-2 text-sm">
              <motion.button
                onClick={() => onReaction(c.id, "like")}
                className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition"
                animate={clickedButton === c.id + "like" ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Image src="/like.svg" alt="Like" width={16} height={16} />
                <span>{c.likes}</span>
              </motion.button>

              <motion.button
                onClick={() => onReaction(c.id, "dislike")}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition"
                animate={clickedButton === c.id + "dislike" ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Image src="/dislike.svg" alt="Dislike" width={16} height={16} />
                <span>{c.dislikes}</span>
              </motion.button>

              <button
                onClick={() => onReply(c.id)}
                className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition"
              >
                <Image src="/reply.svg" alt="Reply" width={16} height={16} />
                Reply
              </button>

              {c.author === currentAuthor && (
                <button
                  onClick={() => onDelete(c.id)}
                  className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition"
                >
                  <Image src="/delete.svg" alt="Delete" width={16} height={16} />
                  Delete
                </button>
              )}
            </div>

            {c.replies?.length > 0 && (
              <div className="ml-6 mt-2 border-l pl-3 space-y-2">
                <CommentList
                  comments={c.replies}
                  onReaction={onReaction}
                  onReply={onReply}
                  onDelete={onDelete}
                  currentAuthor={currentAuthor}
                  clickedButton={clickedButton}
                />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
