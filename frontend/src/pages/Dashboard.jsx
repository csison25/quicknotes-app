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

  const [selectedFile, setSelectedFile] = useState(null);

  const [uploadError, setUploadError] = useState("");

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

  // 🔹 Create Note handles images too 
  const createNote = async () => {
  setUploadError("");
  if (!title.trim() && !body.trim()) return;

  try {
    // 1. Create note first
    const noteRes = await API.post("/notes", {
      title,
      body
    });

    const noteId = noteRes.data.noteId;

    // 2. Upload image IF selected
    if (selectedFile) {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("noteId", noteId);

      await API.post(`/media/upload/${noteId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
    }

    // 3. Reset UI
    setTitle("");
    setBody("");
    setSelectedFile(null);

    // 4. Refresh notes
    fetchNotes();

  } catch (err) {
    console.error("Failed to create note:", err);

    const message =
      err.response?.data?.message ||
      err.message ||
      "Upload failed";

    setUploadError(message);
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

      {/* 🔴 UPLOAD ERROR DISPLAY */}
      {uploadError && (
        <p style={styles.errorText}>
          {uploadError}
        </p>
      )}

      {/* CREATE NOTE */}
      <div style={styles.form}>
        <input
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
          {selectedFile && (
            <p style={styles.selectedFile}>
              📎 {selectedFile.name}
            </p>
          )}
        <button style={styles.saveButton} onClick={createNote}>
  Save
</button>

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
            <h3 style={{ textAlign: "center" }}>{note.title}</h3>
              <p style={{ textAlign: "center" }}>
                {note.body}
              </p>
            {note.media?.length > 0 && (
                  <div style={styles.mediaContainer}>
                    {note.media.map((item) => (
                      <div key={item.id}>
                        {item.mimetype.startsWith("image/") ? (

                          <img
                            src={`/uploads/${item.filename}`}
                            alt="Note media"
                            loading="lazy"
                            style={styles.noteImage}
                          />

                        ) : item.mimetype.startsWith("video/") ? (

                          <video
                            controls
                            style={styles.noteVideo}
                          >
                            <source
                              src={`/uploads/${item.filename}`}
                              type={item.mimetype}
                            />

                            Your browser does not support video playback.
                          </video>

                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

              <button
                style={styles.deleteButton}
                onClick={() => deleteNote(note.id)}
              >
                Delete
              </button>
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
  padding: "20px",
  backgroundColor: "#121212",
  minHeight: "100vh",
  color: "#f5f5f5"
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
  gap: "12px",
  marginBottom: "30px",
  backgroundColor: "#1e1e1e",
  padding: "24px",
  borderRadius: "12px",
  border: "1px solid #333",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  alignItems: "center",
  width: "100%",
  boxSizing: "border-box"
  },
  input: {
  width: "100%",
  maxWidth: "700px",
  padding: "12px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#2a2a2a",
  color: "#f5f5f5",
  boxSizing: "border-box"
  },
  textarea: {
  width: "100%",
  maxWidth: "700px",
  minHeight: "180px",
  padding: "14px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#2a2a2a",
  color: "#f5f5f5",
  resize: "both",
  lineHeight: "1.5",
  boxSizing: "border-box"
  },
  notesContainer: {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",

  gap: "20px",

  alignItems: "start",

  width: "100%"
  },
  noteCard: {
  backgroundColor: "#1e1e1e",
  border: "1px solid #333",
  padding: "20px",
  borderRadius: "12px",

  display: "flex",
  flexDirection: "column",
  gap: "12px",

  overflow: "hidden",

  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",
  },
  mediaContainer: {
  display: "flex",
  flexDirection: "column",

  alignItems: "center",
  justifyContent: "center",

  gap: "16px",

  marginTop: "15px",
  marginBottom: "15px",

  width: "100%",
  },
  noteImage: {
  display: "block",

  width: "100%",
  height: "auto",

  maxHeight: "450px",

  objectFit: "contain",

  borderRadius: "12px",
  border: "1px solid #444",
  backgroundColor: "#1a1a1a",

  overflow: "hidden"
  },
  noteVideo: {
  display: "block",

  width: "100%",
  height: "auto",

  maxHeight: "450px",

  borderRadius: "12px",
  border: "1px solid #444",
  backgroundColor: "#000"
  },
  deleteButton: {
  marginTop: "10px",
  padding: "8px 12px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  backgroundColor: "#b00020",
  color: "#fff",
  alignSelf: "flex-end"
  },
  selectedFile: {
  fontSize: "14px",
  color: "#bdbdbd",
  marginTop: "-4px"
  },
  saveButton: {
  padding: "10px 18px",
  border: "1px solid #444",
  borderRadius: "8px",
  color: "#f5f5f5",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "0.2s ease",
  alignSelf: "center"
  },
  errorText: {
  color: "#ff6b6b",
  marginBottom: "10px",
  textAlign: "center",
  fontWeight: "bold"
  },
};

export default Dashboard;