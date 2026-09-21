import { useState } from "react";

function PostCard({ post }) {

  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

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

    if (comment.trim() === "") {
      return;
    }

    setComments([
      ...comments,
      comment
    ]);

    setComment("");
  };

  return (
    <div className="post-card">

      {/* Post Header */}

      <div className="post-header">

        <div className="post-avatar">
          {post.author.charAt(0)}
        </div>

        <div>
          <h3>{post.author}</h3>
          <p>{post.role}</p>
        </div>

      </div>

      {/* Post Content */}

      <div className="post-content">
        <p>{post.content}</p>
      </div>

      {/* Post Actions */}

      <div className="post-actions">

        <button
          onClick={handleLike}
          className={liked ? "liked" : ""}
        >
          ❤️ {likes}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
        >
          💬 {comments.length}
        </button>

      </div>

      {/* Comments Section */}

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
              onChange={(e) => setComment(e.target.value)}
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
                <strong>Lalit</strong>
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