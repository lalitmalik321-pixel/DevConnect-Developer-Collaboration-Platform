import { useEffect, useState } from "react";

import DeveloperCard from "../components/DeveloperCard";

function Developers() {

  const [developers, setDevelopers] = useState([]);

  const [search, setSearch] = useState("");

  const [skill, setSkill] = useState("All");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {

    fetch("http://localhost:5001/api/developers")

      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch developers");
        }

        return response.json();

      })

      .then((data) => {

        setDevelopers(data);
        setLoading(false);

      })

      .catch((error) => {

        console.error(error);

        setError("Unable to load developers.");
        setLoading(false);

      });

  }, []);

  const filteredDevelopers = developers.filter((developer) => {

    const matchesSearch =
      developer.name
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesSkill =
      skill === "All" ||
      developer.skills.includes(skill);

    return matchesSearch && matchesSkill;

  });

  if (loading) {

    return (
      <div className="developers-page">

        <h1>Discover Developers</h1>

        <p className="loading">
          Loading developers...
        </p>

      </div>
    );

  }

  if (error) {

    return (
      <div className="developers-page">

        <h1>Discover Developers</h1>

        <p className="error">
          {error}
        </p>

      </div>
    );

  }

  return (
    <div className="developers-page">

      <h1>Discover Developers</h1>

      <p className="page-description">
        Find developers and explore their skills.
      </p>

      {/* Search */}

      <div className="search-container">

        <input
          type="text"
          placeholder="Search developer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* Skill Filters */}

      <div className="filter-buttons">

        <button
          onClick={() => setSkill("All")}
          className={skill === "All" ? "active" : ""}
        >
          All
        </button>

        <button
          onClick={() => setSkill("React")}
          className={skill === "React" ? "active" : ""}
        >
          React
        </button>

        <button
          onClick={() => setSkill("Java")}
          className={skill === "Java" ? "active" : ""}
        >
          Java
        </button>

        <button
          onClick={() => setSkill("Node.js")}
          className={skill === "Node.js" ? "active" : ""}
        >
          Node.js
        </button>

      </div>

      {/* Developers */}

      <div className="developer-grid">

        {filteredDevelopers.map((developer) => (

          <DeveloperCard
            key={developer.id}
            developer={developer}
          />

        ))}

      </div>

      {filteredDevelopers.length === 0 && (

        <p className="no-results">
          No developers found.
        </p>

      )}

    </div>
  );
}

export default Developers;