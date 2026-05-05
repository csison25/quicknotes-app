import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import API from "../services/api";

function Admin() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  // 🔹 NEW: UI state
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      setUsername(decoded.username || "User");
      setCurrentUserId(decoded.id);

      if (decoded.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      fetchUsers();
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [navigate]);

  // 🔹 Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // 🔹 Delete user
  const deleteUser = async (id) => {
    setError("");

    if (id === currentUserId) {
      alert("You cannot delete yourself.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setActionLoadingId(id);

    try {
      await API.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Delete failed:", err);

      // ✅ SHOW BACKEND MESSAGE
      const message =
        err.response?.data?.message || "Failed to delete user";
      setError(message);
      alert(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 🔹 Change role
  const changeRole = async (id, newRole) => {
    setError("");

    // 🔒 Prevent self-demotion in UI
    if (id === currentUserId && newRole !== "admin") {
      alert("You cannot remove your own admin role.");
      return;
    }

    setActionLoadingId(id);

    try {
      await API.put(`/admin/users/${id}/role`, {
        role: newRole,
      });
      fetchUsers();
    } catch (err) {
      console.error("Role update failed:", err);

      // ✅ SHOW BACKEND MESSAGE
      const message =
        err.response?.data?.message || "Failed to update role";
      setError(message);
      alert(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2>Admin Dashboard</h2>

         <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => navigate("/dashboard")}>
              ← Back
            </button>

            <button onClick={handleLogout}>
              Logout
            </button>
          </div>
      </div>

      {/* USER INFO */}
      <p>Welcome, {username} (Admin)</p>

      {/* ERROR DISPLAY */}
      {error && <p style={styles.error}>{error}</p>}

      {/* LOADING */}
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <h3>All Users</h3>

          {users.length === 0 ? (
            <p>No users found</p>
          ) : (
            users.map((user) => {
              // 🔍 Count admins (for UI hints)
              const adminCount = users.filter(
                (u) => u.role === "admin"
              ).length;

              const isLastAdmin =
                user.role === "admin" && adminCount <= 1;

              return (
                <div key={user.id} style={styles.userRow}>
                  {/* USER INFO */}
                  <div style={styles.userInfo}>
                    <strong>{user.username}</strong> ({user.role})<br />
                    <small>{user.email}</small>

                    {/* UI WARNING */}
                    {isLastAdmin && (
                      <small style={styles.warning}>
                        Last admin (cannot remove/delete)
                      </small>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div style={styles.actions}>
                    {/* ROLE DROPDOWN */}
                    <select
                      value={user.role}
                      disabled={
                        actionLoadingId === user.id ||
                        isLastAdmin ||
                        user.id === currentUserId
                      }
                      onChange={(e) =>
                        changeRole(user.id, e.target.value)
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={
                        user.id === currentUserId ||
                        actionLoadingId === user.id ||
                        isLastAdmin
                      }
                    >
                      {actionLoadingId === user.id
                        ? "Processing..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "20px" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  userRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderBottom: "1px solid #ccc",
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  error: {
    color: "red",
    marginBottom: "10px",
  },

  warning: {
    color: "orange",
  },
};

export default Admin;