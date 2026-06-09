package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

type User struct {
	Address  string `json:"address"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

var db *sql.DB

func main() {
	// Connect DB (use PostgreSQL or SQLite)
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://user:pass@localhost:5432/aether?sslmode=disable"
	}
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()

	r.POST("/api/auth/register", func(c *gin.Context) {
		var user User
		if err := c.BindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		_, err = db.Exec("INSERT INTO users (address, username, email) VALUES ($1, $2, $3) ON CONFLICT (address) DO UPDATE SET username=$2, email=$3",
			user.Address, user.Username, user.Email)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, user)
	})

	r.Run(":8080")
}
