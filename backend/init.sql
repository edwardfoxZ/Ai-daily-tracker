CREATE TABLE users (
  address TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);