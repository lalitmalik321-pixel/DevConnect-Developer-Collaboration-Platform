import { useState } from "react";

function CreatePost({ onAddPost }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (content.trim() === "") {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5001/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          author: "Lalit Singh Malik",
          role: "Frontend Developer",
          content: content
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const newPost = await response.json();

      onAddPost(newPost);

      setContent("");
    } catch (error) {
      console.error(error);
      setError("Unable to create post.");
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

      {error && <p className="error">{error}</p>}
    </form>
  );
}

export default CreatePost;