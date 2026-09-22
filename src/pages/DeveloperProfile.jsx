import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function DeveloperProfile() {
  const { id } = useParams();

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              <span key={skill}>{skill}</span>
            ))
          ) : (
            <p>No skills added yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}

export default DeveloperProfile;