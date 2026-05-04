const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


// 🔹 GET ALL USERS
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, email, role FROM users"
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});


// 🔹 DELETE USER (FULLY SAFE VERSION)
router.delete("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  const userIdToDelete = req.params.id;

  try {
    // 🔒 Prevent deleting yourself
    if (req.user.id == userIdToDelete) {
      return res.status(400).json({
        message: "You cannot delete yourself"
      });
    }

    // 🔍 Get target user
    const [targetUser] = await db.query(
      "SELECT role FROM users WHERE id = ?",
      [userIdToDelete]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 If deleting an admin → check count
    if (targetUser[0].role === "admin") {
      const [admins] = await db.query(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
      );

      if (admins[0].count <= 1) {
        return res.status(400).json({
          message: "Cannot delete the last admin"
        });
      }
    }

    // ✅ Safe delete
    await db.query("DELETE FROM users WHERE id = ?", [userIdToDelete]);

    res.json({ message: "User deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});


// 🔹 UPDATE ROLE (FULLY SAFE VERSION)
router.put("/users/:id/role", authMiddleware, adminOnly, async (req, res) => {
  const userIdToUpdate = req.params.id;
  const { role } = req.body;

  try {
    // 🔍 Validate role
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 🔒 Prevent self-demotion
    if (req.user.id == userIdToUpdate && role !== "admin") {
      return res.status(400).json({
        message: "You cannot remove your own admin role"
      });
    }

    // 🔍 Get current role
    const [targetUser] = await db.query(
      "SELECT role FROM users WHERE id = ?",
      [userIdToUpdate]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 Prevent removing last admin
    if (targetUser[0].role === "admin" && role !== "admin") {
      const [admins] = await db.query(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
      );

      if (admins[0].count <= 1) {
        return res.status(400).json({
          message: "Cannot remove role from the last admin"
        });
      }
    }

    // ✅ Safe update
    await db.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, userIdToUpdate]
    );

    res.json({ message: "Role updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Role update failed" });
  }
});

module.exports = router;