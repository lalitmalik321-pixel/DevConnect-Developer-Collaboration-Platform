import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Messages() {
  const { userId } = useParams();
  const { user, token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/messages/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load messages"
        );
      }

      setMessages(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReceiver = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/developers/user/${userId}`
        );

      const data = await response.json();

      if (response.ok) {
        setReceiver(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    loadMessages();
    loadReceiver();
  }, [userId, token]);

  const handleSend = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        "http://localhost:5001/api/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverId: Number(userId),
            content: content.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send message"
        );
      }

      setContent("");

      await loadMessages();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="messages-page">
        <h2>Please login to use messages.</h2>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">

        <div className="messages-header">
          <h2>
            {receiver
              ? `Chat with ${receiver.name}`
              : "Messages"}
          </h2>
        </div>

        <div className="messages-list">

          {loading && (
            <p className="messages-info">
              Loading messages...
            </p>
          )}

          {!loading && error && (
            <p className="messages-error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            messages.length === 0 && (
              <p className="messages-info">
                No messages yet. Start the conversation!
              </p>
            )}

          {messages.map((message) => {
            const isMine =
              Number(message.sender_id) ===
              Number(user.id);

            return (
              <div
                key={message.id}
                className={`message-row ${
                  isMine ? "mine" : "received"
                }`}
              >
                <div className="message-bubble">
                  <p>{message.content}</p>

                  <span>
                    {new Date(
                      message.created_at
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <form
          className="message-form"
          onSubmit={handleSend}
        >
          <input
            type="text"
            placeholder="Write a message..."
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={
              sending || !content.trim()
            }
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Messages;