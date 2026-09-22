import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DeveloperProfile() {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [developer, setDeveloper] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [connecting, setConnecting] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5001/api/developers/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Developer not found");
        }

        return response.json();
      })
      .then((data) => {
        setDeveloper(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Developer not found.");
        setLoading(false);
      });
  }, [id]);

  const handleConnect = async () => {
    if (!user) {
      setConnectionError("Please login to connect with developers.");
      return;
    }

    setConnecting(true);
    setConnectionMessage("");
    setConnectionError("");

    try {
      const response = await fetch(
        `http://localhost:5001/api/developers/${id}/connect`,
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
          data.message || "Failed to send connection request"
        );
      }

      setConnectionMessage(
        "Connection request sent successfully!"
      );
    } catch (error) {
      console.error(error);
      setConnectionError(error.message);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <h1>Loading profile...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <h1>{error}</h1>
      </div>
    );
  }

  const isOwnProfile =
    developer.user_id &&
    user &&
    Number(developer.user_id) === Number(user.id);

  return (
    <div className="profile-page">
      <div className="profile-card">

        <div className="profile-avatar">
          {developer.name.charAt(0)}
        </div>

        <h1>{developer.name}</h1>

        <p className="profile-role">
          {developer.role}
        </p>

        <p className="profile-location">
          📍 {developer.location}
        </p>

        <p className="profile-bio">
          Hello! I am {developer.name}, a{" "}
          {developer.role.toLowerCase()}. I enjoy building
          projects and learning new technologies.
        </p>

        <div className="profile-skills">
          {developer.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>

        {user && !isOwnProfile && developer.user_id && (
          <button
            className="connect-btn"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting
              ? "Connecting..."
              : "Connect"}
          </button>
        )}

        {!user && (
          <p className="connection-info">
            Login to connect with this developer.
          </p>
        )}

        {connectionMessage && (
          <p className="success-message">
            {connectionMessage}
          </p>
        )}

        {connectionError && (
          <p className="error">
            {connectionError}
          </p>
        )}

      </div>
    </div>
  );
}

export default DeveloperProfile;