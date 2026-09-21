require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");
const jwt = require("jsonwebtoken");


const app = express();

const PORT = 5001;

app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.json({
    message: "DevConnect API is running!"
  });
});

app.get("/api/developers", (req, res) => {
  const sql = `
    SELECT
      d.id,
      d.name,
      d.role,
      d.location,
      GROUP_CONCAT(ds.skill) AS skills
    FROM developers d
    LEFT JOIN developer_skills ds
      ON d.id = ds.developer_id
    GROUP BY d.id
    ORDER BY d.id
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to fetch developers"
      });
    }

    const developers = results.map((developer) => ({
      id: developer.id,
      name: developer.name,
      role: developer.role,
      location: developer.location,
      skills: developer.skills
        ? developer.skills.split(",")
        : []
    }));

    res.json(developers);
  });
});

app.get("/api/developers/:id", (req, res) => {
  const developerId = req.params.id;

  const sql = `
    SELECT
      d.id,
      d.name,
      d.role,
      d.location,
      GROUP_CONCAT(ds.skill) AS skills
    FROM developers d
    LEFT JOIN developer_skills ds
      ON d.id = ds.developer_id
    WHERE d.id = ?
    GROUP BY d.id
  `;

  db.query(sql, [developerId], (error, results) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to fetch developer"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Developer not found"
      });
    }

    const developer = {
      id: results[0].id,
      name: results[0].name,
      role: results[0].role,
      location: results[0].location,
      skills: results[0].skills
        ? results[0].skills.split(",")
        : []
    };

    res.json(developer);
  });
});

app.get("/api/posts", (req, res) => {
  const sql = `
    SELECT *
    FROM posts
    ORDER BY created_at DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to fetch posts"
      });
    }

    res.json(results);
  });
});

app.post("/api/posts", (req, res) => {
  const { author, role, content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({
      message: "Post content is required"
    });
  }

  const sql = `
    INSERT INTO posts (author, role, content)
    VALUES (?, ?, ?)
  `;

  const values = [
    author || "Lalit Singh Malik",
    role || "Frontend Developer",
    content.trim()
  ];

  db.query(sql, values, (error, result) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to create post"
      });
    }

    const newPost = {
      id: result.insertId,
      author: values[0],
      role: values[1],
      content: values[2],
      likes: 0,
      comments: 0
    };

    res.status(201).json(newPost);
  });
});

app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required"
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      name,
      email,
      hashedPassword,
      role || "Frontend Developer"
    ];

    db.query(sql, values, (error, result) => {
      if (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "Email already registered"
          });
        }

        return res.status(500).json({
          message: "Failed to register user"
        });
      }

      res.status(201).json({
        message: "User registered successfully",
        userId: result.insertId
      });
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong"
    });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  const sql = `
    SELECT id, name, email, password, role
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [email], async (error, results) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        message: "Login failed"
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1h"
  }
);

res.json({
  message: "Login successful",
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }
});
    });
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});