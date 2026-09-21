import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Developers from "./pages/Developers";
import Profile from "./pages/Profile";
import DeveloperProfile from "./pages/DeveloperProfile";
import Posts from "./pages/Posts";

import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/developers"
          element={<Developers />}
        />

        <Route
          path="/developers/:id"
          element={<DeveloperProfile />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />
        <Route
          path="/posts"
          element={<Posts />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;