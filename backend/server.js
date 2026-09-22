require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");
const jwt = require("jsonwebtoken");
const authenticateToken = require("./authMiddleware");


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
    SELECT
      p.id,
      p.user_id,
      p.content,
      p.likes,
      p.comments,
      p.created_at,
      u.name AS author,
      u.role
    FROM posts p
    LEFT JOIN users u
      ON p.user_id = u.id
    ORDER BY p.created_at DESC
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

app.post(
  "/api/posts",
  authenticateToken,
  (req, res) => {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Post content is required"
      });
    }

    const userId = req.user.id;

    const userSql = `
      SELECT name, role
      FROM users
      WHERE id = ?
    `;

    db.query(userSql, [userId], (userError, userResults) => {
      if (userError) {
        console.error(userError);

        return res.status(500).json({
          message: "Failed to find user"
        });
      }

      if (userResults.length === 0) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      const user = userResults[0];

      const sql = `
        INSERT INTO posts
        (user_id, author, role, content)
        VALUES (?, ?, ?, ?)
      `;

      const values = [
        userId,
        user.name,
        user.role,
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
          user_id: userId,
          author: user.name,
          role: user.role,
          content: content.trim(),
          likes: 0,
          comments: 0
        };

        res.status(201).json(newPost);
      });
    });
  }
);

app.delete("/api/posts/:id", authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const checkSql = `
    SELECT user_id
    FROM posts
    WHERE id = ?
  `;

  db.query(checkSql, [postId], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to check post"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    // Make sure the logged-in user owns the post
    if (results[0].user_id !== userId) {
      return res.status(403).json({
        message: "You can only delete your own posts"
      });
    }

    const deleteSql = `
      DELETE FROM posts
      WHERE id = ?
    `;

    db.query(deleteSql, [postId], (deleteError) => {
      if (deleteError) {
        console.error(deleteError);
        return res.status(500).json({
          message: "Failed to delete post"
        });
      }

      res.json({
        message: "Post deleted successfully"
      });
    });
  });
});
app.put("/api/posts/:id", authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({
      message: "Post content is required"
    });
  }

  const checkSql = `
    SELECT user_id
    FROM posts
    WHERE id = ?
  `;

  db.query(checkSql, [postId], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to check post"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    if (results[0].user_id !== userId) {
      return res.status(403).json({
        message: "You can only edit your own posts"
      });
    }

    const updateSql = `
      UPDATE posts
      SET content = ?
      WHERE id = ?
    `;

    db.query(
      updateSql,
      [content.trim(), postId],
      (updateError) => {
        if (updateError) {
          console.error(updateError);
          return res.status(500).json({
            message: "Failed to update post"
          });
        }

        res.json({
          message: "Post updated successfully",
          content: content.trim()
        });
      }
    );
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