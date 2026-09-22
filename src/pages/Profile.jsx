import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, token, login } = useAuth();

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    role: ""
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:5001/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        return response.json();
      })
      .then((data) => {
        setProfile(data);

        setFormData({
          name: data.name,
          role: data.role
        });

        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Unable to load profile.");
        setLoading(false);
      });
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = () => {
    setMessage("");
    setError("");

    setFormData({
      name: profile.name,
      role: profile.role
    });

    setEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      role: profile.role
    });

    setEditing(false);
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5001/api/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            role: formData.role
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      const updatedProfile = {
        ...profile,
        name: data.name,
        role: data.role
      };

      setProfile(updatedProfile);

      login(
        {
          ...user,
          name: data.name,
          role: data.role
        },
        token
      );

      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>Please Login</h1>
          <p>
            You need to login to view your profile.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>Loading profile...</h1>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>{error}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">

        <div className="profile-avatar">
          {profile.name.charAt(0)}
        </div>

        {!editing ? (
          <>
            <h1>{profile.name}</h1>

            <p className="profile-role">
              {profile.role}
            </p>

            <p className="profile-email">
              📧 {profile.email}
            </p>

            <p className="profile-bio">
              Welcome to my DevConnect profile. I am a{" "}
              {profile.role.toLowerCase()}.
            </p>

            <div className="profile-info">
              <div>
                <strong>Member since</strong>
                <p>
                  {new Date(
                    profile.created_at
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              className="edit-profile-btn"
              onClick={handleEdit}
            >
              Edit Profile
            </button>
          </>
        ) : (
          <form
            className="edit-profile-form"
            onSubmit={handleSave}
          >
            <h2>Edit Profile</h2>

            <label>Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <label>Role</label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="Frontend Developer">
                Frontend Developer
              </option>

              <option value="Backend Developer">
                Backend Developer
              </option>

              <option value="Full Stack Developer">
                Full Stack Developer
              </option>

              <option value="Java Developer">
                Java Developer
              </option>

              <option value="Data Analyst">
                Data Analyst
              </option>
            </select>

            <div className="edit-profile-actions">

              <button
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

            </div>

            {error && (
              <p className="error">
                {error}
              </p>
            )}
          </form>
        )}

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}

      </div>
    </div>
  );
}

export default Profile;