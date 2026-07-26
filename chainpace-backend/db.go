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

	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE,
		phone TEXT UNIQUE,
		password_hash TEXT,
		wallet_address TEXT UNIQUE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err = db.Exec(schema); err != nil {
		log.Fatal("Failed to create schema:", err)
	}

	log.Println("✅ Connected to SQLite and schema ready (chainpace.db)")
}
