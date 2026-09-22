import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MessagesInbox() {
  const { user, token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadConversations = async () => {
      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5001/api/messages",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load conversations"
          );
        }

        setConversations(data);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [token]);

  if (!user) {
    return (
      <div className="messages-inbox-page">
        <h2>Please login to view messages.</h2>
      </div>
    );
  }

  return (
    <div className="messages-inbox-page">
      <div className="messages-inbox">
        <div className="messages-inbox-header">
          <h1>Messages</h1>
          <p>Your conversations</p>
        </div>

        {loading && (
          <p className="inbox-info">
            Loading conversations...
          </p>
        )}

        {!loading && error && (
          <p className="inbox-error">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          conversations.length === 0 && (
            <div className="empty-inbox">
              <h3>No conversations yet</h3>
              <p>
                Connect with a developer and start
                a conversation.
              </p>
              <Link to="/developers">
                Find Developers
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          conversations.length > 0 && (
            <div className="conversation-list">
              {conversations.map((conversation) => (
                <Link
                  key={conversation.user_id}
                  to={`/messages/${conversation.user_id}`}
                  className="conversation-item"
                >
                  <div className="conversation-avatar">
                    {conversation.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="conversation-content">
                    <div className="conversation-top">
                      <h3>
                        {conversation.name}
                      </h3>

                      <span>
                        {new Date(
                          conversation.created_at
                        ).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </span>
                    </div>

                    <p className="conversation-role">
                      {conversation.role}
                    </p>

                    <p className="last-message">
                      {conversation.last_message}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export default MessagesInbox;