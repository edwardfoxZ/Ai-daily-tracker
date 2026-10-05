package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type googleTokenInfo struct {
	Email string `json:"email"`
	Aud   string `json:"aud"`
	Sub   string `json:"sub"`
}

func googleAuthHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Credential string `json:"credential"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Credential) == "" {
		writeError(w, http.StatusBadRequest, "credential is required")
		return
	}
	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + req.Credential)
	if err != nil {
		writeError(w, http.StatusBadGateway, "Google unreachable")
		return
	}
	defer resp.Body.Close()
	var info googleTokenInfo
	_ = json.NewDecoder(resp.Body).Decode(&info)
	email := strings.ToLower(strings.TrimSpace(info.Email))
	if email == "" {
		writeError(w, http.StatusUnauthorized, "Invalid Google token")
		return
	}
	if want := os.Getenv("GOOGLE_CLIENT_ID"); want != "" && info.Aud != want {
		writeError(w, http.StatusUnauthorized, "Google client mismatch")
		return
	}
	var id int64
	var username string
	err = db.QueryRow(`SELECT id, username FROM users WHERE lower(email) = lower(?)`, email).Scan(&id, &username)
	if err != nil {
		base := strings.Split(email, "@")[0]
		username = base
		for i := 0; i < 6; i++ {
			var n int
			_ = db.QueryRow(`SELECT COUNT(*) FROM users WHERE username = ?`, username).Scan(&n)
			if n == 0 {
				break
			}
			username = fmt.Sprintf("%s%d", base, i+2)
		}
		res, err := db.Exec(`INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`, username, email, "google:"+info.Sub)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Could not create Google user")
			return
		}
		id, _ = res.LastInsertId()
	}
	token, err := generateToken(id, username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Could not sign in")
		return
	}
	setAuthCookie(w, token)
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": map[string]interface{}{"id": id, "username": username, "email": email}})
}

func setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name: "token", Value: token, Path: "/", HttpOnly: true, SameSite: http.SameSiteLaxMode, MaxAge: 60 * 60 * 24 * 7,
	})
}
