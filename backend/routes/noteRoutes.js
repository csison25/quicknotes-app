const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

//Create Note
router.post("/", authMiddleware, (req, res) => {
  const { title, body } = req.body;
  const userId = req.user.id;

  const query = "INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)";

  db.query(query, [userId, title, body], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Note created!" });
  });
});


//Read Note
router.get("/", authMiddleware, (req, res) => {
  const userId = req.user.id;

  const query = "SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC";

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json(err);

    res.json(results);
  });
});


//Update Note
router.put("/:id", authMiddleware, (req, res) => {
  const noteId = req.params.id;
  const { title, body } = req.body;
  const userId = req.user.id;

  const query = `
    UPDATE notes 
    SET title = ?, body = ? 
    WHERE id = ? AND user_id = ?
  `;

  db.query(query, [title, body, noteId, userId], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Note updated!" });
  });
});

//Delete note
router.delete("/:id", authMiddleware, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.id;

  const query = "DELETE FROM notes WHERE id = ? AND user_id = ?";

  db.query(query, [noteId, userId], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Note deleted!" });
  });
});

// 👇 KEEP THIS AT BOTTOM
module.exports = router;