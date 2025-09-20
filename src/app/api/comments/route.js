import { v4 as uuidv4 } from "uuid";

let comments = []; 

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
    comments = comments.map((c) =>
      c.id === parentId ? { ...c, replies: [...c.replies, newComment] } : c
    );
  } else {
    comments.push(newComment);
  }

  return new Response(JSON.stringify(newComment), { status: 201 });
}

export async function PUT(req) {
  const { id, action } = await req.json();

  const updateReaction = (arr) =>
    arr.map((c) => {
      if (c.id === id) {
        if (action === "like") c.likes++;
        if (action === "dislike") c.dislikes++;
      }
      if (c.replies.length > 0) c.replies = updateReaction(c.replies);
      return c;
    });

  comments = updateReaction(comments);
  return new Response(JSON.stringify(comments), { status: 200 });
}

export async function DELETE(req) {
  const { id, author } = await req.json();

  const removeComment = (arr) =>
    arr
      .filter((c) => !(c.id === id && c.author === author))
      .map((c) => ({
        ...c,
        replies: removeComment(c.replies),
      }));

  comments = removeComment(comments);
  return new Response(JSON.stringify(comments), { status: 200 });
}
