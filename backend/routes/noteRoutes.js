const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


// CREATE NOTE
router.post("/", authMiddleware, async (req, res) => {
  const { title, body } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      "INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)",
      [userId, title, body]
    );

    res.json({
      message: "Note created!",
      noteId: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create note" });
  }
});


// READ NOTES + MEDIA (USER-SPECIFIC)
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // 🔹 Get notes
    const [notes] = await db.query(
      `
      SELECT *
      FROM notes
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    // 🔹 Get media belonging to user
    const [media] = await db.query(
      `
      SELECT *
      FROM media
      WHERE user_id = ?
      `,
      [userId]
    );

    // 🔹 Attach media to matching notes
    const notesWithMedia = notes.map((note) => ({
      ...note,
      media: media.filter((m) => m.note_id === note.id)
    }));

    res.json(notesWithMedia);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch notes"
    });
  }
});


// ADMIN TEST ROUTE
router.get("/admin-test", authMiddleware, adminOnly, (req, res) => {
  res.json({ message: "Welcome Admin" });
});


// UPDATE NOTE
router.put("/:id", authMiddleware, async (req, res) => {
  const noteId = req.params.id;
  const { title, body } = req.body;
  const userId = req.user.id;

  try {
    await db.query(
      `UPDATE notes 
       SET title = ?, body = ? 
       WHERE id = ? AND user_id = ?`,
      [title, body, noteId, userId]
    );

    res.json({ message: "Note updated!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update note" });
  }
});


// DELETE NOTE
router.delete("/:id", authMiddleware, async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.id;

  try {
    await db.query(
      "DELETE FROM notes WHERE id = ? AND user_id = ?",
      [noteId, userId]
    );

    res.json({ message: "Note deleted!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete note" });
  }
});


// EXPORT
module.exports = router;