import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function CreatePost({ onAddPost }) {
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (content.trim() === "") {
      return;
    }

    if (!user) {
      setError("Please login before creating a post.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5001/api/posts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            author: user.name,
            role: user.role,
            content: content
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create post"
        );
      }

      onAddPost(data);

      setContent("");
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-post" onSubmit={handleSubmit}>
      <h2>Create a Post</h2>

      <textarea
        placeholder="What are you building today?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Post"}
      </button>

      {error && (
        <p className="error">
          {error}
        </p>
      )}
    </form>
  );
}

export default CreatePost;