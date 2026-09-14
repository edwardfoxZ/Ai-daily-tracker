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
		allow_anyone_message INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		from_user_id INTEGER NOT NULL,
		to_user_id INTEGER NOT NULL,
		body TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS email_otps (
		email TEXT PRIMARY KEY,
		code_hash TEXT NOT NULL,
		expires_at TEXT NOT NULL
	);
	CREATE TABLE IF NOT EXISTS friendships (
		user_a INTEGER NOT NULL,
		user_b INTEGER NOT NULL,
		PRIMARY KEY (user_a, user_b)
	);
	`
	if _, err = db.Exec(schema); err != nil {
		log.Fatal("Failed to create schema:", err)
	}
	_, _ = db.Exec(`ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''`)
	_, _ = db.Exec(`ALTER TABLE users ADD COLUMN allow_anyone_message INTEGER DEFAULT 0`)
	log.Println("✅ Connected to SQLite and schema ready (chainpace.db)")
}
