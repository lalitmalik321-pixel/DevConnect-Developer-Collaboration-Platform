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
      d.user_id,
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
      user_id: results[0].user_id,
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

app.get("/api/posts", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
  p.id,
  p.user_id,
  p.content,
  p.created_at,
  u.name AS author,
  u.role,
  COUNT(DISTINCT pl.id) AS likes,
  COUNT(DISTINCT c.id) AS comments,
  MAX(
    CASE
      WHEN pl.user_id = ? THEN 1
      ELSE 0
    END
  ) AS liked
FROM posts p

LEFT JOIN users u
  ON p.user_id = u.id

LEFT JOIN post_likes pl
  ON p.id = pl.post_id

LEFT JOIN comments c
  ON p.id = c.post_id

    GROUP BY
      p.id,
      p.user_id,
      p.content,
      p.created_at,
      u.name,
      u.role

    ORDER BY p.created_at DESC
  `;

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to fetch posts"
      });
    }

    const posts = results.map((post) => ({
      ...post,
      likes: Number(post.likes),
      liked: Boolean(post.liked)
    }));

    res.json(posts);
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

    const userRole = role || "Frontend Developer";

    const insertUserSql = `
      INSERT INTO users
      (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    const userValues = [
      name.trim(),
      email.trim(),
      hashedPassword,
      userRole
    ];

    db.query(
      insertUserSql,
      userValues,
      (userError, userResult) => {
        if (userError) {
          console.error(userError);

          if (userError.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              message: "Email already registered"
            });
          }

          return res.status(500).json({
            message: "Failed to register user"
          });
        }

        const userId = userResult.insertId;

        const insertDeveloperSql = `
          INSERT INTO developers
          (user_id, name, role, location)
          VALUES (?, ?, ?, ?)
        `;

        const developerValues = [
          userId,
          name.trim(),
          userRole,
          "India"
        ];

        db.query(
          insertDeveloperSql,
          developerValues,
          (developerError) => {
            if (developerError) {
              console.error(developerError);

              return res.status(500).json({
                message:
                  "User registered but developer profile could not be created"
              });
            }

            res.status(201).json({
              message: "User registered successfully",
              userId: userId
            });
          }
        );
      }
    );
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

app.post("/api/posts/:id/like", authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const checkPostSql = `
    SELECT id
    FROM posts
    WHERE id = ?
  `;

  db.query(checkPostSql, [postId], (postError, postResults) => {
    if (postError) {
      console.error(postError);
      return res.status(500).json({
        message: "Failed to check post"
      });
    }

    if (postResults.length === 0) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    const checkLikeSql = `
      SELECT id
      FROM post_likes
      WHERE post_id = ? AND user_id = ?
    `;

    db.query(
      checkLikeSql,
      [postId, userId],
      (likeError, likeResults) => {
        if (likeError) {
          console.error(likeError);
          return res.status(500).json({
            message: "Failed to check like"
          });
        }

        // User already liked the post → unlike it
        if (likeResults.length > 0) {
          const deleteLikeSql = `
            DELETE FROM post_likes
            WHERE post_id = ? AND user_id = ?
          `;

          db.query(
            deleteLikeSql,
            [postId, userId],
            (deleteError) => {
              if (deleteError) {
                console.error(deleteError);
                return res.status(500).json({
                  message: "Failed to remove like"
                });
              }

              const countSql = `
                SELECT COUNT(*) AS likes
                FROM post_likes
                WHERE post_id = ?
              `;

              db.query(
                countSql,
                [postId],
                (countError, countResults) => {
                  if (countError) {
                    console.error(countError);
                    return res.status(500).json({
                      message: "Failed to count likes"
                    });
                  }

                  res.json({
                    liked: false,
                    likes: countResults[0].likes
                  });
                }
              );
            }
          );

          return;
        }

        // User has not liked the post → add like
        const addLikeSql = `
          INSERT INTO post_likes (post_id, user_id)
          VALUES (?, ?)
        `;

        db.query(
          addLikeSql,
          [postId, userId],
          (insertError) => {
            if (insertError) {
              console.error(insertError);
              return res.status(500).json({
                message: "Failed to like post"
              });
            }

            const countSql = `
              SELECT COUNT(*) AS likes
              FROM post_likes
              WHERE post_id = ?
            `;

            db.query(
              countSql,
              [postId],
              (countError, countResults) => {
                if (countError) {
                  console.error(countError);
                  return res.status(500).json({
                    message: "Failed to count likes"
                  });
                }

                res.json({
                  liked: true,
                  likes: countResults[0].likes
                });
              }
            );
          }
        );
      }
    );
  });
});

app.post(
  "/api/posts/:id/comments",
  authenticateToken,
  (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Comment cannot be empty"
      });
    }

    const postSql = `
      SELECT id
      FROM posts
      WHERE id = ?
    `;

    db.query(postSql, [postId], (postError, postResults) => {
      if (postError) {
        console.error(postError);

        return res.status(500).json({
          message: "Failed to check post"
        });
      }

      if (postResults.length === 0) {
        return res.status(404).json({
          message: "Post not found"
        });
      }

      const insertSql = `
        INSERT INTO comments
        (post_id, user_id, content)
        VALUES (?, ?, ?)
      `;

      db.query(
        insertSql,
        [postId, userId, content.trim()],
        (error, result) => {
          if (error) {
            console.error(error);

            return res.status(500).json({
              message: "Failed to create comment"
            });
          }

          const userSql = `
            SELECT name
            FROM users
            WHERE id = ?
          `;

          db.query(userSql, [userId], (userError, users) => {
            if (userError) {
              console.error(userError);

              return res.status(500).json({
                message: "Comment created but user could not be loaded"
              });
            }

            res.status(201).json({
              id: result.insertId,
              post_id: Number(postId),
              user_id: userId,
              content: content.trim(),
              author: users[0].name
            });
          });
        }
      );
    });
  }
);

app.get("/api/posts/:id/comments", (req, res) => {
  const postId = req.params.id;

  const sql = `
    SELECT
      c.id,
      c.post_id,
      c.user_id,
      c.content,
      c.created_at,
      u.name AS author
    FROM comments c

    JOIN users u
      ON c.user_id = u.id

    WHERE c.post_id = ?

    ORDER BY c.created_at ASC
  `;

  db.query(sql, [postId], (error, results) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to fetch comments"
      });
    }

    res.json(results);
  });
});

app.post(
  "/api/developers/:id/connect",
  authenticateToken,
  (req, res) => {
    const developerId = Number(req.params.id);
    const requesterId = req.user.id;

    const developerSql = `
      SELECT user_id
      FROM developers
      WHERE id = ?
    `;

    db.query(
      developerSql,
      [developerId],
      (developerError, developerResults) => {
        if (developerError) {
          console.error(developerError);

          return res.status(500).json({
            message: "Failed to find developer"
          });
        }

        if (developerResults.length === 0) {
          return res.status(404).json({
            message: "Developer not found"
          });
        }

        const receiverId = developerResults[0].user_id;

        if (!receiverId) {
          return res.status(400).json({
            message:
              "This developer does not have a connected user account"
          });
        }

        if (requesterId === receiverId) {
          return res.status(400).json({
            message: "You cannot connect with yourself"
          });
        }

        const checkSql = `
          SELECT id, status
          FROM connections
          WHERE
            (requester_id = ? AND receiver_id = ?)
            OR
            (requester_id = ? AND receiver_id = ?)
        `;

        db.query(
          checkSql,
          [
            requesterId,
            receiverId,
            receiverId,
            requesterId
          ],
          (checkError, checkResults) => {
            if (checkError) {
              console.error(checkError);

              return res.status(500).json({
                message: "Failed to check connection"
              });
            }

            if (checkResults.length > 0) {
              return res.status(409).json({
                message: "Connection already exists"
              });
            }

            const insertSql = `
              INSERT INTO connections
              (requester_id, receiver_id)
              VALUES (?, ?)
            `;

            db.query(
              insertSql,
              [requesterId, receiverId],
              (insertError, result) => {
                if (insertError) {
                  console.error(insertError);

                  return res.status(500).json({
                    message:
                      "Failed to send connection request"
                  });
                }

                res.status(201).json({
                  message: "Connection request sent",
                  connectionId: result.insertId
                });
              }
            );
          }
        );
      }
    );
  }
);

app.get(
  "/api/connections/requests",
  authenticateToken,
  (req, res) => {
    const userId = req.user.id;

    const sql = `
      SELECT
        c.id,
        c.status,
        c.created_at,
        u.id AS requester_id,
        u.name AS requester_name,
        u.email AS requester_email,
        u.role AS requester_role
      FROM connections c

      JOIN users u
        ON c.requester_id = u.id

      WHERE c.receiver_id = ?
        AND c.status = 'pending'

      ORDER BY c.created_at DESC
    `;

    db.query(sql, [userId], (error, results) => {
      if (error) {
        console.error(error);

        return res.status(500).json({
          message: "Failed to fetch connection requests"
        });
      }

      res.json(results);
    });
  }
);

app.put(
  "/api/connections/:id",
  authenticateToken,
  (req, res) => {
    const connectionId = Number(req.params.id);
    const { status } = req.body;
    const userId = req.user.id;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid connection status"
      });
    }

    const sql = `
      UPDATE connections
      SET status = ?
      WHERE id = ?
        AND receiver_id = ?
        AND status = 'pending'
    `;

    db.query(
      sql,
      [status, connectionId, userId],
      (error, result) => {
        if (error) {
          console.error(error);

          return res.status(500).json({
            message: "Failed to update connection"
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Connection request not found"
          });
        }

        res.json({
          message:
            status === "accepted"
              ? "Connection accepted"
              : "Connection rejected"
        });
      }
    );
  }
);

app.get(
  "/api/connections",
  authenticateToken,
  (req, res) => {
    const userId = req.user.id;

    const sql = `
      SELECT
        c.id,
        c.status,
        c.created_at,

        CASE
          WHEN c.requester_id = ? THEN u2.id
          ELSE u1.id
        END AS user_id,

        CASE
          WHEN c.requester_id = ? THEN u2.name
          ELSE u1.name
        END AS name,

        CASE
          WHEN c.requester_id = ? THEN u2.email
          ELSE u1.email
        END AS email,

        CASE
          WHEN c.requester_id = ? THEN u2.role
          ELSE u1.role
        END AS role

      FROM connections c

      JOIN users u1
        ON c.requester_id = u1.id

      JOIN users u2
        ON c.receiver_id = u2.id

      WHERE
        (c.requester_id = ? OR c.receiver_id = ?)
        AND c.status = 'accepted'

      ORDER BY c.created_at DESC
    `;

    db.query(
      sql,
      [
        userId,
        userId,
        userId,
        userId,
        userId,
        userId
      ],
      (error, results) => {
        if (error) {
          console.error(error);

          return res.status(500).json({
            message: "Failed to fetch connections"
          });
        }

        res.json(results);
      }
    );
  }
);

app.get(
  "/api/profile",
  authenticateToken,
  (req, res) => {
    const userId = req.user.id;

    const sql = `
      SELECT
        id,
        name,
        email,
        role,
        location,
        bio,
        skills,
        created_at
      FROM users
      WHERE id = ?
    `;

    db.query(sql, [userId], (error, results) => {
      if (error) {
        console.error(error);

        return res.status(500).json({
          message: "Failed to fetch profile"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      res.json(results[0]);
    });
  }
);

app.put(
  "/api/profile",
  authenticateToken,
  (req, res) => {
    const userId = req.user.id;

    const {
      name,
      role,
      location,
      bio,
      skills
    } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        message: "Name and role are required"
      });
    }

    // Convert skills string into an array
    const skillsArray = skills
      ? skills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== "")
      : [];

    // 1. Update users table
    const updateUserSql = `
      UPDATE users
      SET
        name = ?,
        role = ?,
        location = ?,
        bio = ?,
        skills = ?
      WHERE id = ?
    `;

    const userValues = [
      name.trim(),
      role,
      location || "",
      bio || "",
      skillsArray.join(", "),
      userId
    ];

    db.query(
      updateUserSql,
      userValues,
      (userError) => {
        if (userError) {
          console.error(userError);

          return res.status(500).json({
            message: "Failed to update profile"
          });
        }

        // 2. Check developer profile
        const developerSql = `
          SELECT id
          FROM developers
          WHERE user_id = ?
        `;

        db.query(
          developerSql,
          [userId],
          (developerError, developerResults) => {
            if (developerError) {
              console.error(developerError);

              return res.status(500).json({
                message: "Failed to check developer profile"
              });
            }

            // --------------------------------
            // 3. Developer already exists
            // --------------------------------
            if (developerResults.length > 0) {
              const developerId =
                developerResults[0].id;

              const updateDeveloperSql = `
                UPDATE developers
                SET
                  name = ?,
                  role = ?,
                  location = ?
                WHERE id = ?
              `;

              db.query(
                updateDeveloperSql,
                [
                  name.trim(),
                  role,
                  location || "",
                  developerId
                ],
                (updateError) => {
                  if (updateError) {
                    console.error(updateError);

                    return res.status(500).json({
                      message:
                        "Failed to update developer profile"
                    });
                  }

                  // Remove old skills
                  const deleteSkillsSql = `
                    DELETE FROM developer_skills
                    WHERE developer_id = ?
                  `;

                  db.query(
                    deleteSkillsSql,
                    [developerId],
                    (deleteError) => {
                      if (deleteError) {
                        console.error(deleteError);

                        return res.status(500).json({
                          message:
                            "Failed to update skills"
                        });
                      }

                      // If there are no skills, finish here
                      if (skillsArray.length === 0) {
                        return res.json({
                          message:
                            "Profile updated successfully"
                        });
                      }

                      // Add new skills
                      const skillValues = skillsArray.map(
                        (skill) => [developerId, skill]
                      );

                      const insertSkillsSql = `
                        INSERT INTO developer_skills
                        (developer_id, skill)
                        VALUES ?
                      `;

                      db.query(
                        insertSkillsSql,
                        [skillValues],
                        (skillError) => {
                          if (skillError) {
                            console.error(skillError);

                            return res.status(500).json({
                              message:
                                "Failed to save skills"
                            });
                          }

                          return res.json({
                            message:
                              "Profile updated successfully"
                          });
                        }
                      );
                    }
                  );
                }
              );

              return;
            }

            // --------------------------------
            // 4. Developer profile doesn't exist
            // --------------------------------

            const insertDeveloperSql = `
              INSERT INTO developers
              (user_id, name, role, location)
              VALUES (?, ?, ?, ?)
            `;

            db.query(
              insertDeveloperSql,
              [
                userId,
                name.trim(),
                role,
                location || ""
              ],
              (insertError, result) => {
                if (insertError) {
                  console.error(insertError);

                  return res.status(500).json({
                    message:
                      "Failed to create developer profile"
                  });
                }

                const developerId =
                  result.insertId;

                // If there are no skills, finish here
                if (skillsArray.length === 0) {
                  return res.json({
                    message:
                      "Profile updated successfully"
                  });
                }

                const skillValues = skillsArray.map(
                  (skill) => [developerId, skill]
                );

                const insertSkillsSql = `
                  INSERT INTO developer_skills
                  (developer_id, skill)
                  VALUES ?
                `;

                db.query(
                  insertSkillsSql,
                  [skillValues],
                  (skillError) => {
                    if (skillError) {
                      console.error(skillError);

                      return res.status(500).json({
                        message:
                          "Failed to save skills"
                      });
                    }

                    return res.json({
                      message:
                        "Profile updated successfully"
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});