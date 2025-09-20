# Next Commenting System

A **simple, interactive commenting system** built with **Next.js**, **React**, and **Framer Motion**, featuring replies, likes/dislikes, editing, deleting, and timestamps. Perfect for local demos or small projects.

---

## Features

- **Post comments** – Write your name and comment, then post it instantly.
- **Reply to comments** – Nest replies under any comment.
- **Edit comments** – You can edit a comment **if you are the original author**.
- **Delete comments** – Delete a comment or reply you authored.
- **Author recognition** – If you type the name you previously commented with, the **edit and delete buttons appear** for your comments automatically.
- **Likes & dislikes** – React independently to comments and replies.
- **Timestamps** – Each comment shows the time elapsed since it was posted.
- **Newest comments first** – Latest comments appear at the top of the list.
- **Thread collapse** – Collapse and expand comment threads for easier navigation.
- **Smooth animations** – Framer Motion provides subtle bouncy effects for reactions, posting, and replies.

---

## How it Works

- **Local memory** – Comments are stored in memory on the server. Refreshing the page will reset all comments.
- **Nested structure** – Replies can be nested indefinitely.
- **Real-time updates** – Posting, replying, editing, deleting, or reacting immediately updates the comment list on the page.

