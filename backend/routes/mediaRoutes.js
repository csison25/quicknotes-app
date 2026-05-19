const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");

    cb(null, uniqueName);
  }
});

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },

  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, true);
  }
});

router.post(
  "/upload/:noteId",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    const noteId = req.params.noteId;
    const userId = req.user.id;

    try {
      // 🔒 Verify note belongs to logged-in user
      const [notes] = await db.query(
        "SELECT id FROM notes WHERE id = ? AND user_id = ?",
        [noteId, userId]
      );

      if (notes.length === 0) {
        return res.status(403).json({
          message: "You do not own this note"
        });
      }

      // 🔒 Ensure file exists
      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded"
        });
      }

      // 💾 Save media record
      const [result] = await db.query(
        `INSERT INTO media
        (note_id, user_id, filename, filepath, mimetype, size)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          userId,
          req.file.filename,
          req.file.path,
          req.file.mimetype,
          req.file.size
        ]
      );

      res.json({
        message: "Upload successful",
        mediaId: result.insertId,
        file: req.file.filename
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Upload failed"
      });
    }
  }
);

// GET media for a specific note
router.get(
  "/note/:noteId",
  authMiddleware,
  async (req, res) => {
    const noteId = req.params.noteId;
    const userId = req.user.id;

    try {
      // Verify ownership
      const [notes] = await db.query(
        "SELECT id FROM notes WHERE id = ? AND user_id = ?",
        [noteId, userId]
      );

      if (notes.length === 0) {
        return res.status(403).json({
          message: "Unauthorized"
        });
      }

      // Fetch media
      const [media] = await db.query(
        `SELECT id, filename, filepath, mimetype
         FROM media
         WHERE note_id = ?`,
        [noteId]
      );

      res.json(media);

    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Failed to fetch media"
      });
    }
  }
);

module.exports = router;