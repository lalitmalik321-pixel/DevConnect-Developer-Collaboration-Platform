import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, logout } = useAuth();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
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
        <Link to="/" onClick={closeMenu}>
          Home
        </Link>

        <Link to="/developers" onClick={closeMenu}>
          Developers
        </Link>

        <Link to="/posts" onClick={closeMenu}>
          Feed
        </Link>

        <Link to="/profile" onClick={closeMenu}>
          Profile
        </Link>

        {user ? (
          <>
            <span className="nav-user">
              Hi, {user.name}
            </span>

            <button
              className="login-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="login-btn"
            onClick={closeMenu}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;