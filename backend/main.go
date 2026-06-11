package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

type User struct {
	Address   string `json:"address,omitempty"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatarUrl,omitempty"`
	Password  string `json:"password,omitempty"`
}

var db *sql.DB

func main() {
	log.Println("🚀 Starting ESTHER Backend...")

	dbPath := "./esther.db"
	var err error
	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Enhanced users table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			address TEXT,
			username TEXT UNIQUE,
			email TEXT UNIQUE,
			avatar_url TEXT,
			password TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("✅ SQLite Database Ready")

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Register / Update Profile
	r.POST("/api/auth/register", func(c *gin.Context) {
		var user User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		hashed := ""
		if user.Password != "" {
			h, _ := bcrypt.GenerateFromPassword([]byte(user.Password), 12)
			hashed = string(h)
		}

		_, err = db.Exec(`
			INSERT INTO users (address, username, email, avatar_url, password) 
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(email) DO UPDATE SET 
				username = excluded.username,
				avatar_url = excluded.avatar_url,
				updated_at = CURRENT_TIMESTAMP`,
			user.Address, user.Username, user.Email, user.AvatarURL, hashed)

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username or email already taken"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":   "success",
			"username":  user.Username,
			"email":     user.Email,
			"avatarUrl": user.AvatarURL,
		})
	})

	log.Println("✅ ESTHER Backend running on http://localhost:8080")
	r.Run(":8080")
}
