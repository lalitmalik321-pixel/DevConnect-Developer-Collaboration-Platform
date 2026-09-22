import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DeveloperProfile() {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [connectionStatus, setConnectionStatus] = useState("none");
  const [connecting, setConnecting] = useState(false);

  // Load developer profile
  useEffect(() => {
    const loadDeveloper = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/developers/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Developer not found"
          );
        }

        setDeveloper(data);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDeveloper();
  }, [id]);

  // Load connection status
  useEffect(() => {
    const loadConnectionStatus = async () => {
      if (!user || !token || !developer) {
        return;
      }

      // Don't check connection with yourself
      if (Number(user.id) === Number(developer.user_id)) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5001/api/developers/${id}/connection-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        console.log("Connection status:", data);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load connection status"
          );
        }

        setConnectionStatus(data.status);
      } catch (error) {
        console.error(
          "Connection status error:",
          error
        );
      }
    };

    loadConnectionStatus();
  }, [id, user, token, developer]);

  // Send connection request
  const handleConnect = async () => {
    if (!user) {
      alert("Please login to connect with developers.");
      return;
    }

    setConnecting(true);

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
          data.message ||
            "Failed to send connection request"
        );
      }

      setConnectionStatus("pending");

      alert("Connection request sent!");
    } catch (error) {
      console.error(error);
      alert(error.message);
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

  return (
    <div className="profile-page">

      <div className="profile-card">

        <div className="profile-avatar">
          {developer.name.charAt(0).toUpperCase()}
        </div>

        <h1>{developer.name}</h1>

        <p className="profile-role">
          {developer.role}
        </p>

        {developer.email && (
          <p className="profile-email">
            📧 {developer.email}
          </p>
        )}

        <p className="profile-location">
          📍 {developer.location || "India"}
        </p>

        <p className="profile-bio">
          {developer.bio ||
            "This developer has not added a bio yet."}
        </p>

        <div className="profile-skills">
          {developer.skills &&
          developer.skills.length > 0 ? (
            developer.skills.map((skill) => (
              <span key={skill}>
                {skill}
              </span>
            ))
          ) : (
            <p>No skills added yet.</p>
          )}
        </div>

        {/* Connection button */}

        {user &&
          Number(user.id) !==
            Number(developer.user_id) && (
            <div className="connection-section">

              {connectionStatus === "none" && (
                <button
                  className="connect-btn"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting
                    ? "Sending..."
                    : "Connect"}
                </button>
              )}

              {connectionStatus === "pending" && (
                <button
                  className="connect-btn pending"
                  disabled
                >
                  Request Sent
                </button>
              )}

              {connectionStatus === "accepted" && (
  <>
    <button
      className="connect-btn connected"
      disabled
    >
      Connected
    </button>

    <button
      className="message-btn"
      onClick={() =>
        window.location.href = `/messages/${developer.user_id}`
      }
    >
      Message
    </button>
  </>
)}

            </div>
          )}

      </div>

    </div>
  );
}

export default DeveloperProfile;