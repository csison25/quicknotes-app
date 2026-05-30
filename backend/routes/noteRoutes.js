const fs = require("fs").promises;
const path = require("path");
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

    // Group media by note_id
    const mediaMap = {};

    for (const item of media) {
      if (!mediaMap[item.note_id]) {
        mediaMap[item.note_id] = [];
      }

      mediaMap[item.note_id].push(item);
    }

    // Attach media efficiently
    const notesWithMedia = notes.map((note) => ({
      ...note,
      media: mediaMap[note.id] || []
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


// DELETE NOTE + ASSOCIATED FILES
router.delete("/:id", authMiddleware, async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.id;

  try {
    // Get media belonging to this note and user
    const [media] = await db.query(
      `
      SELECT filename
      FROM media
      WHERE note_id = ?
      AND user_id = ?
      `,
      [noteId, userId]
    );

    // Delete physical files
    for (const item of media) {
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        item.filename
      );

      try {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${item.filename}`);
      } catch (err) {
        // Ignore missing files
        if (err.code !== "ENOENT") {
          console.error(
            `Failed to delete file ${item.filename}:`,
            err
          );
        }
      }
    }

    // Delete note
    await db.query(
      "DELETE FROM notes WHERE id = ? AND user_id = ?",
      [noteId, userId]
    );

    res.json({
      message: "Note and associated files deleted!"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete note"
    });
  }
});


// EXPORT
module.exports = router;