USE quicknotes_db;

INSERT INTO users (username, email, password_hash)
VALUES ('testuser', 'test@example.com', 'hashedpassword');

INSERT INTO notes (user_id, title, body)
VALUES (1, 'First Note', 'This is a test note.');