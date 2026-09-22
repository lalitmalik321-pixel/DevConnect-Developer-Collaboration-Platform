import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Connections() {
  const { token } = useAuth();

  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load pending connection requests
  const loadRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/connections/requests",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load requests"
        );
      }

      setRequests(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // Load accepted connections
  const loadConnections = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/connections",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load connections"
        );
      }

      setConnections(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // Load requests and connections
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        loadRequests(),
        loadConnections()
      ]);

      setLoading(false);
    };

    loadData();
  }, [token]);

  // Accept or reject a request
  const handleRequest = async (
    connectionId,
    status
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/connections/${connectionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: status
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update request"
        );
      }

      // Remove request from pending list
      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.id !== connectionId
        )
      );

      // Reload accepted connections
      if (status === "accepted") {
        loadConnections();
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="connections-page">
        <h1>Connection Requests</h1>
        <p className="loading">
          Loading connections...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connections-page">
        <h1>Connection Requests</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="connections-page">

      <h1>Connection Requests</h1>

      <p className="page-description">
        Manage developers who want to connect with you.
      </p>

      {/* ========================= */}
      {/* PENDING REQUESTS */}
      {/* ========================= */}

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No pending connection requests.</p>
        </div>
      ) : (
        <div className="requests-container">

          {requests.map((request) => (
            <div
              className="connection-card"
              key={request.id}
            >

              <div className="connection-avatar">
                {request.requester_name.charAt(0)}
              </div>

              <div className="connection-info">

                <h3>
                  {request.requester_name}
                </h3>

                <p>
                  {request.requester_role}
                </p>

                <p>
                  {request.requester_email}
                </p>

              </div>

              <div className="connection-actions">

                <button
                  className="accept-btn"
                  onClick={() =>
                    handleRequest(
                      request.id,
                      "accepted"
                    )
                  }
                >
                  Accept
                </button>

                <button
                  className="reject-btn"
                  onClick={() =>
                    handleRequest(
                      request.id,
                      "rejected"
                    )
                  }
                >
                  Reject
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

      {/* ========================= */}
      {/* MY CONNECTIONS */}
      {/* ========================= */}

      <div className="my-connections-section">

        <h2>My Connections</h2>

        {connections.length === 0 ? (
          <div className="empty-state">
            <p>
              You don't have any connections yet.
            </p>
          </div>
        ) : (
          <div className="requests-container">

            {connections.map((connection) => (
              <div
                className="connection-card"
                key={connection.id}
              >

                <div className="connection-avatar">
                  {connection.name.charAt(0)}
                </div>

                <div className="connection-info">

                  <h3>
                    {connection.name}
                  </h3>

                  <p>
                    {connection.role}
                  </p>

                  <p>
                    {connection.email}
                  </p>

                </div>

                <div className="connection-status">
                  Connected
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default Connections;