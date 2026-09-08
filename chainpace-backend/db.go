package main

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var db *sql.DB

func initDB() {
	var err error
	db, err = sql.Open("sqlite", "./chainpace.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	_, _ = db.Exec(`PRAGMA foreign_keys = ON;`)

	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE,
		phone TEXT UNIQUE,
		password_hash TEXT,
		wallet_address TEXT UNIQUE,
		bio TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		from_user_id INTEGER NOT NULL,
		to_user_id INTEGER NOT NULL,
		body TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(from_user_id) REFERENCES users(id),
		FOREIGN KEY(to_user_id) REFERENCES users(id)
	);
	CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(from_user_id, to_user_id, created_at);
	`
	if _, err = db.Exec(schema); err != nil {
		log.Fatal("Failed to create schema:", err)
	}

	// older DBs created before bio existed
	_, _ = db.Exec(`ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''`)

	log.Println("✅ Connected to SQLite and schema ready (chainpace.db)")
}
