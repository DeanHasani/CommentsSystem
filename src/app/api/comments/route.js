import { v4 as uuidv4 } from "uuid";

let comments = [];

const addReplyNested = (arr, parentId, newComment) =>
  arr.map((c) => {
    if (c.id === parentId) return { ...c, replies: [newComment, ...(c.replies || [])] };
    if (c.replies && c.replies.length > 0) return { ...c, replies: addReplyNested(c.replies, parentId, newComment) };
    return c;
  });

const updateCommentNested = (arr, id, action, text) =>
  arr.map((c) => {
    if (c.id === id) {
      if (action === "like") c.likes++;
      if (action === "dislike") c.dislikes++;
      if (action === "edit") c.text = text;
    }
    if (c.replies && c.replies.length > 0) c.replies = updateCommentNested(c.replies, id, action, text);
    return c;
  });

const removeCommentNested = (arr, id, author) =>
  arr
    .filter((c) => !(c.id === id && c.author === author))
    .map((c) => ({
      ...c,
      replies: c.replies ? removeCommentNested(c.replies, id, author) : [],
    }));


export async function GET() {
  return new Response(JSON.stringify(comments), { status: 200 });
}

export async function POST(req) {
  const { text, author, parentId } = await req.json();
  const newComment = {
    id: uuidv4(),
    text,
    author,
    likes: 0,
    dislikes: 0,
    replies: [],
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
  };

  if (parentId) {
    comments = addReplyNested(comments, parentId, newComment);
  } else {
    comments = [newComment, ...comments]; 
  }

  return new Response(JSON.stringify(newComment), { status: 201 });
}

export async function PUT(req) {
  const { id, action, text } = await req.json();

  comments = updateCommentNested(comments, id, action, text);
  return new Response(JSON.stringify(comments), { status: 200 });
}

export async function DELETE(req) {
  const { id, author } = await req.json();

  comments = removeCommentNested(comments, id, author);
  return new Response(JSON.stringify(comments), { status: 200 });
}
