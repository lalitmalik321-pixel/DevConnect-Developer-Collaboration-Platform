import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function DeveloperProfile() {
  const { id } = useParams();

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          {developer.role.toLowerCase()}.
          I enjoy building projects and learning new technologies.
        </p>

        <div className="profile-skills">
          {developer.skills.map((skill) => (
            <span key={skill}>
              {skill}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}

export default DeveloperProfile;