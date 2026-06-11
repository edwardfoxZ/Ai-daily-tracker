DROP TABLE IF EXISTS users;
CREATE TABLE users (
  address TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);