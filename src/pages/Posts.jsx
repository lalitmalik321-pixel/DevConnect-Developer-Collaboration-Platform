import { useEffect, useState } from "react";

import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";

function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5001/api/posts")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        return response.json();
      })
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Unable to load posts.");
        setLoading(false);
      });
  }, []);

  const handleAddPost = (newPost) => {
    setPosts((currentPosts) => [
      newPost,
      ...currentPosts
    ]);
  };

  const handleDelete = (postId) => {
  setPosts((currentPosts) =>
    currentPosts.filter((post) => post.id !== postId)
  );
};

  if (loading) {
    return (
      <div className="posts-page">
        <h1>DevConnect Feed</h1>
        <p className="loading">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="posts-page">
        <h1>DevConnect Feed</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="posts-page">
      <h1>DevConnect Feed</h1>

      <p className="page-description">
        See what developers are building and learning.
      </p>

      <CreatePost onAddPost={handleAddPost} />

      <div className="posts-container">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default Posts;