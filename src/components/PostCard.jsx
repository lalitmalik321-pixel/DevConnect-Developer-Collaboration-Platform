import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function PostCard({ post, onDelete }) {
  const { user, token } = useAuth();

  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
      setLiked(false);
    } else {
      setLikes(likes + 1);
      setLiked(true);
    }
  };

  const handleComment = (e) => {
    e.preventDefault();

    if (comment.trim() === "") return;

    setComments([...comments, comment]);
    setComment("");
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
          onClick={() =>
            setShowComments(!showComments)
          }
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

            {comments.map((item, index) => (
              <div
                className="comment"
                key={index}
              >
                <strong>
                  {user?.name || "Developer"}
                </strong>

                <p>{item}</p>
              </div>
            ))}

          </div>

        </div>
      )}

    </div>
  );
}

export default PostCard;