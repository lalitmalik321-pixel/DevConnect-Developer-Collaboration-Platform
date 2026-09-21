import { Link } from "react-router-dom";

function DeveloperCard({ developer }) {
  return (
    <div className="developer-card">

      <div className="avatar">
        {developer.name.charAt(0)}
      </div>

      <h3>{developer.name}</h3>

      <p className="role">
        {developer.role}
      </p>

      <p className="location">
        📍 {developer.location}
      </p>

      <div className="skills">
        {developer.skills.map((skill) => (
          <span key={skill}>
            {skill}
          </span>
        ))}
      </div>

      <Link
        to={`/developers/${developer.id}`}
        className="profile-btn"
      >
        View Profile
      </Link>

    </div>
  );
}

export default DeveloperCard;