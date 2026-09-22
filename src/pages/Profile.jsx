import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { token, user, login } = useAuth();

  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    location: "",
    bio: "",
    skills: ""
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        setProfile(data);

        setFormData({
          name: data.name || "",
          role: data.role || "",
          location: data.location || "",
          bio: data.bio || "",
          skills: data.skills || ""
        });
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadProfile();
    }
  }, [token]);

  // Handle form changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Save profile
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
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      // Update displayed profile
      setProfile({
        ...profile,
        ...formData
      });

      // Update logged-in user information
      // so Navbar also shows the new name.
      login(
        {
          ...user,
          name: formData.name,
          role: formData.role
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

  if (loading) {
    return (
      <div className="profile-page">
        <p className="loading">
          Loading profile...
        </p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {!editing ? (
        <div className="profile-card">

          <div className="profile-avatar">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <h1>{profile.name}</h1>

          <p className="profile-role">
            {profile.role}
          </p>

          <p className="profile-email">
            📧 {profile.email}
          </p>

          <p className="profile-location">
            📍 {profile.location || "India"}
          </p>

          <p className="profile-bio">
            {profile.bio ||
              "No bio added yet. Tell other developers about yourself."}
          </p>

          {profile.skills && (
            <div className="profile-skills">
              {profile.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean)
                .map((skill) => (
                  <span key={skill}>
                    {skill}
                  </span>
                ))}
            </div>
          )}

          <button
            className="edit-profile-btn"
            onClick={() => {
              setEditing(true);
              setMessage("");
            }}
          >
            Edit Profile
          </button>

          {message && (
            <p className="success-message">
              {message}
            </p>
          )}

        </div>
      ) : (
        <form
          className="profile-card profile-edit-form"
          onSubmit={handleSave}
        >

          <h1>Edit Profile</h1>

          <label>Name</label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Email</label>

          <input
            type="email"
            value={profile.email}
            disabled
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

            <option value="Machine Learning Engineer">
              Machine Learning Engineer
            </option>
          </select>

          <label>Location</label>

          <input
            type="text"
            name="location"
            placeholder="e.g. Chandigarh, India"
            value={formData.location}
            onChange={handleChange}
          />

          <label>Bio</label>

          <textarea
            name="bio"
            placeholder="Tell other developers about yourself..."
            value={formData.bio}
            onChange={handleChange}
          />

          <label>Skills</label>

          <input
            type="text"
            name="skills"
            placeholder="React, Java, Python, SQL"
            value={formData.skills}
            onChange={handleChange}
          />

          <div className="profile-form-actions">

            <button
              type="submit"
              className="save-profile-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

            <button
              type="button"
              className="cancel-profile-btn"
              onClick={() => {
                setEditing(false);
                setError("");
              }}
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

    </div>
  );
}

export default Profile;