import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function PostCard({ post, onDelete }) {
  const { user, token } = useAuth();

  const [likes, setLikes] = useState(Number(post.likes) || 0);
  const [liked, setLiked] = useState(Boolean(Number(post.liked)));

  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const handleLike = async () => {
  if (!user) {
    alert("Please login to like a post.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5001/api/posts/${post.id}/like`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to like post"
      );
    }

    setLikes(data.likes);
    setLiked(data.liked);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

const loadComments = async () => {
  setCommentsLoading(true);

  try {
    const response = await fetch(
      `http://localhost:5001/api/posts/${post.id}/comments`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load comments"
      );
    }

    setComments(data);
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    setCommentsLoading(false);
  }
};

  const handleComment = async (e) => {
  e.preventDefault();

  if (!user) {
    alert("Please login to comment.");
    return;
  }

  if (comment.trim() === "") {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5001/api/posts/${post.id}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: comment
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to create comment"
      );
    }

    setComments([...comments, data]);
    setComment("");
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `http://localhost:5001/api/posts/${post.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete post"
        );
      }

      onDelete(post.id);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (editContent.trim() === "") {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `http://localhost:5001/api/posts/${post.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            content: editContent
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update post"
        );
      }

      post.content = data.content;

      setEditContent(data.content);
      setEditing(false);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const isOwner = user && post.user_id === user.id;

  return (
    <div className="post-card">

      <div className="post-header">

        <div className="post-avatar">
          {post.author
            ? post.author.charAt(0)
            : "D"}
        </div>

        <div>
          <h3>{post.author || "Developer"}</h3>
          <p>{post.role || ""}</p>
        </div>

        {isOwner && (
          <div className="post-owner-actions">

            <button
              className="edit-btn"
              onClick={() => setEditing(true)}
              disabled={editing || deleting}
            >
              Edit
            </button>

            <button
              className="delete-btn"
              onClick={handleDelete}
              disabled={deleting || editing}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>

          </div>
        )}

      </div>

      <div className="post-content">

        {editing ? (
          <div className="edit-post">

            <textarea
              value={editContent}
              onChange={(e) =>
                setEditContent(e.target.value)
              }
            />

            <div className="edit-actions">

              <button
                onClick={handleEdit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => {
                  setEditContent(post.content);
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </button>

            </div>

          </div>
        ) : (
          <p>{post.content}</p>
        )}

      </div>

      <div className="post-actions">

        <button
          onClick={handleLike}
          className={liked ? "liked" : ""}
        >
          ❤️ {likes}
        </button>

        <button
  onClick={() => {
    const willShow = !showComments;

    setShowComments(willShow);

    if (willShow) {
      loadComments();
    }
  }}
>
  💬 {comments.length}
</button>

      </div>

      {showComments && (
        <div className="comments-section">

          <form
            className="comment-form"
            onSubmit={handleComment}
          >
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
            />

            <button type="submit">
              Send
            </button>
          </form>

          <div className="comments-list">

            {commentsLoading ? (
  <p>Loading comments...</p>
) : (
  comments.map((item) => (
    <div
      className="comment"
      key={item.id}
    >
      <strong>
        {item.author}
      </strong>

      <p>{item.content}</p>
    </div>
  ))
)}

          </div>

        </div>
      )}

    </div>
  );
}

export default PostCard;