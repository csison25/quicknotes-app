import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { jwtDecode } from "jwt-decode";

function Dashboard() {
  const navigate = useNavigate();

  // 🔹 State
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  // 🔐 Auth check + decode user
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUsername(decoded.username || "User");
      setRole(decoded.role || "user");

      // ✅ FIX: only fetch notes if token is valid
      fetchNotes();
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [navigate]);

  // 🔹 Fetch Notes
  const fetchNotes = async () => {
    try {
      const res = await API.get("/notes");
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    }
  };

  // 🔹 Create Note
  const createNote = async () => {
    if (!title.trim() && !body.trim()) return;

    try {
      await API.post("/notes", { title, body });
      setTitle("");
      setBody("");
      fetchNotes();
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  // 🔹 Delete Note
  const deleteNote = async (id) => {
    try {
      await API.delete(`/notes/${id}`);
      fetchNotes();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2>Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* USERNAME */}
      <p style={styles.username}>Welcome, {username}</p>

      {/* ✅ CLEAN ADMIN BUTTON (UX IMPROVEMENT) */}
      {role === "admin" && (
        <button
          style={styles.adminButton}
          onClick={() => navigate("/admin")}
        >
          🔧 Admin Dashboard
        </button>
      )}

      {/* CREATE NOTE */}
      <div style={styles.form}>
        <button onClick={createNote}>Save</button>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />

        <textarea
          placeholder="Write your note..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={styles.textarea}
        />
      </div>

      {/* NOTES LIST */}
      <div style={styles.notesContainer}>
        {notes.map((note) => (
          <div key={note.id} style={styles.noteCard}>
            <h3>{note.title}</h3>
            <p>{note.body}</p>
            <button onClick={() => deleteNote(note.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  username: {
    marginBottom: "20px"
  },
  adminButton: {
    marginBottom: "20px",
    padding: "10px",
    fontSize: "14px",
    cursor: "pointer"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "30px"
  },
  input: {
    padding: "10px",
    fontSize: "16px"
  },
  textarea: {
    padding: "10px",
    fontSize: "16px",
    minHeight: "100px"
  },
  notesContainer: {
    display: "grid",
    gap: "15px"
  },
  noteCard: {
    border: "1px solid #ccc",
    padding: "15px",
    borderRadius: "8px"
  }
};

export default Dashboard;