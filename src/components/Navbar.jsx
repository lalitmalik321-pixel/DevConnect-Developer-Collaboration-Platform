import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {

  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">

      <Link
        to="/"
        className="logo"
        onClick={closeMenu}
      >
        DevConnect
      </Link>

      <button
        className="menu-btn"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div
        className={`nav-links ${
          menuOpen ? "open" : ""
        }`}
      >

        <Link
          to="/"
          onClick={closeMenu}
        >
          Home
        </Link>

        <Link
          to="/developers"
          onClick={closeMenu}
        >
          Developers
        </Link>

        <Link
          to="/posts"
          onClick={closeMenu}
        >
          Feed
        </Link>

        <Link
          to="/profile"
          onClick={closeMenu}
        >
          Profile
        </Link>

        <button
          className="login-btn"
          onClick={closeMenu}
        >
          Login
        </button>

      </div>

    </nav>
  );
}

export default Navbar;