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
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Aud           string `json:"aud"`
	Name          string `json:"name"`
	Sub           string `json:"sub"`
	Error         string `json:"error_description"`
}

func googleAuthHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Credential string `json:"credential"`
		Username   string `json:"username"`
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
	if info.Email == "" {
		writeError(w, http.StatusUnauthorized, "Invalid Google token")
		return
	}
	want := os.Getenv("GOOGLE_CLIENT_ID")
	if want != "" && info.Aud != want {
		writeError(w, http.StatusUnauthorized, "Google client mismatch")
		return
	}
	email := strings.ToLower(strings.TrimSpace(info.Email))
	user, err := FindUserByEmail(email)
	if err != nil {
		username := strings.TrimSpace(req.Username)
		if username == "" {
			base := strings.Split(email, "@")[0]
			username = base
			for i := 0; i < 5; i++ {
				if taken, _ := UsernameTaken(username); !taken {
					break
				}
				username = fmt.Sprintf("%s%d", base, i+2)
			}
		}
		user, err = CreateUser(username, email, "", "google:"+info.Sub)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
	}
	token, err := generateToken(user.ID, user.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Could not sign in")
		return
	}
	setAuthCookie(w, token)
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": publicUser(user)})
}

func setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 7,
	})
}
