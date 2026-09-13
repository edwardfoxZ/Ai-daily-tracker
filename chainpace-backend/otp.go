package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type requestOtpBody struct {
	Email string `json:"email"`
}

type verifyOtpBody struct {
	Email    string `json:"email"`
	Code     string `json:"code"`
	Username string `json:"username"`
}

func requestOtpHandler(w http.ResponseWriter, r *http.Request) {
	var req requestOtpBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if !strings.Contains(email, "@") {
		writeError(w, http.StatusBadRequest, "Valid email required")
		return
	}

	code := sixDigits()
	hash, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Could not create code")
		return
	}
	expires := time.Now().Add(10 * time.Minute).UTC().Format(time.RFC3339)
	_, _ = db.Exec(`DELETE FROM email_otps WHERE email = ?`, email)
	if _, err := db.Exec(
		`INSERT INTO email_otps (email, code_hash, expires_at) VALUES (?, ?, ?)`,
		email, string(hash), expires,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "Could not store code")
		return
	}

	sent, sendErr := sendOtpEmail(email, code)
	if sendErr != nil {
		log.Println("otp email:", sendErr)
	}

	resp := map[string]interface{}{
		"ok":      true,
		"expires": expires,
		"sent":    sent,
	}
	if !sent {
		resp["devCode"] = code
		log.Println("OTP for", email, "is", code)
	}
	writeJSON(w, http.StatusOK, resp)
}

func verifyOtpHandler(w http.ResponseWriter, r *http.Request) {
	var req verifyOtpBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	code := strings.TrimSpace(req.Code)
	if email == "" || len(code) < 4 {
		writeError(w, http.StatusBadRequest, "Email and code required")
		return
	}

	var hash, expires string
	err := db.QueryRow(
		`SELECT code_hash, expires_at FROM email_otps WHERE email = ?`, email,
	).Scan(&hash, &expires)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "No code found. Request a new one.")
		return
	}
	exp, _ := time.Parse(time.RFC3339, expires)
	if time.Now().After(exp) {
		writeError(w, http.StatusUnauthorized, "Code expired")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(code)) != nil {
		writeError(w, http.StatusUnauthorized, "Wrong code")
		return
	}
	_, _ = db.Exec(`DELETE FROM email_otps WHERE email = ?`, email)

	user, _, err := FindUserByIdentifier(email)
	if err == nil {
		token, err := generateToken(user.ID, user.Username)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Session failed")
			return
		}
		setAuthCookie(w, token)
		writeJSON(w, http.StatusOK, map[string]interface{}{"user": user, "isNew": false})
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"isNew":             true,
			"requiresUsername": true,
		})
		return
	}

	created, err := CreateUser(username, &email, nil, "")
	if err != nil {
		writeError(w, http.StatusConflict, "Username already in use")
		return
	}
	token, err := generateToken(created.ID, created.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Session failed")
		return
	}
	setAuthCookie(w, token)
	writeJSON(w, http.StatusCreated, map[string]interface{}{"user": created, "isNew": true})
}

func sixDigits() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	n := int(b[0])<<16 | int(b[1])<<8 | int(b[2])
	return fmt.Sprintf("%06d", n%1000000)
}

func sendOtpEmail(to, code string) (bool, error) {
	key := os.Getenv("RESEND_API_KEY")
	if key == "" {
		return false, nil
	}
	from := os.Getenv("OTP_FROM_EMAIL")
	if from == "" {
		from = "Chainpace <onboarding@resend.dev>"
	}
	body := fmt.Sprintf(`{"from":%q,"to":[%q],"subject":"Your Chainpace code","text":%q}`,
		from, to, "Your one-time code is "+code+" (valid 10 minutes).")
	req, err := http.NewRequest(http.MethodPost, "https://api.resend.com/emails", strings.NewReader(body))
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, err
	}
	defer res.Body.Close()
	slug, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 300 {
		return false, fmt.Errorf("resend %s: %s", res.Status, slug)
	}
	return true, nil
}
