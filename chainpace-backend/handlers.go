package main

import (
	"encoding/json"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// setAuthCookie attaches the JWT as an httpOnly cookie.
func setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "chainpace_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 7, // 7 days
		// Secure: true, // enable once you're serving over HTTPS
	})
}

/* -------------------------------------------------
   POST /api/auth/signup   (email or phone signup)
------------------------------------------------- */

type signupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

func signupHandler(w http.ResponseWriter, r *http.Request) {
	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Phone = strings.TrimSpace(req.Phone)

	if req.Username == "" || len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "Username is required and password must be at least 8 characters")
		return
	}
	if req.Email == "" && req.Phone == "" {
		writeError(w, http.StatusBadRequest, "Email or phone is required")
		return
	}

	hashBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to secure password")
		return
	}

	var emailPtr, phonePtr *string
	if req.Email != "" {
		emailPtr = &req.Email
	}
	if req.Phone != "" {
		phonePtr = &req.Phone
	}

	user, err := CreateUser(req.Username, emailPtr, phonePtr, string(hashBytes))
	if err != nil {
		writeError(w, http.StatusConflict, "Username, email, or phone already in use")
		return
	}

	token, err := generateToken(user.ID, user.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate session")
		return
	}
	setAuthCookie(w, token)

	writeJSON(w, http.StatusCreated, map[string]interface{}{"user": user})
}

/* -------------------------------------------------
   POST /api/auth/login   (email/phone/username + password)
------------------------------------------------- */

type loginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	req.Identifier = strings.TrimSpace(req.Identifier)

	user, passwordHash, err := FindUserByIdentifier(req.Identifier)
	if err != nil || passwordHash == "" {
		writeError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := generateToken(user.ID, user.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate session")
		return
	}
	setAuthCookie(w, token)

	writeJSON(w, http.StatusOK, map[string]interface{}{"user": user})
}

/* -------------------------------------------------
   POST /api/auth/wallet   (wallet-only signup or login)
   If the wallet address already has an account -> log in.
   If not -> create a new account with the given username.
------------------------------------------------- */

type walletAuthRequest struct {
	WalletAddress string `json:"walletAddress"`
	Username      string `json:"username"` // only required if this is a new wallet
}

func walletAuthHandler(w http.ResponseWriter, r *http.Request) {
	var req walletAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	req.WalletAddress = strings.TrimSpace(req.WalletAddress)
	req.Username = strings.TrimSpace(req.Username)

	if req.WalletAddress == "" {
		writeError(w, http.StatusBadRequest, "walletAddress is required")
		return
	}

	// existing wallet -> log in
	if user, err := FindUserByWallet(req.WalletAddress); err == nil {
		token, err := generateToken(user.ID, user.Username)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to generate session")
			return
		}
		setAuthCookie(w, token)
		writeJSON(w, http.StatusOK, map[string]interface{}{"user": user, "isNew": false})
		return
	}

	// new wallet -> requires username to create the account
	if req.Username == "" {
		writeJSON(w, http.StatusOK, map[string]interface{}{"isNew": true, "requiresUsername": true})
		return
	}

	user, err := CreateWalletUser(req.Username, req.WalletAddress)
	if err != nil {
		writeError(w, http.StatusConflict, "Username or wallet already in use")
		return
	}

	token, err := generateToken(user.ID, user.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate session")
		return
	}
	setAuthCookie(w, token)
	writeJSON(w, http.StatusCreated, map[string]interface{}{"user": user, "isNew": true})
}

/* -------------------------------------------------
   GET /api/auth/check-username?username=xyz
------------------------------------------------- */

func checkUsernameHandler(w http.ResponseWriter, r *http.Request) {
	username := strings.TrimSpace(r.URL.Query().Get("username"))
	if len(username) < 3 {
		writeJSON(w, http.StatusOK, map[string]bool{"available": false})
		return
	}
	taken, err := IsUsernameTaken(username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check username")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"available": !taken})
}

/* -------------------------------------------------
   GET /api/auth/me   (read the current session from cookie)
------------------------------------------------- */

func meHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("chainpace_token")
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	claims, err := parseToken(cookie.Value)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Session expired")
		return
	}
	user, err := FindUserByID(claims.UserID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "User not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": user})
}

/* -------------------------------------------------
   POST /api/auth/logout
------------------------------------------------- */

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "chainpace_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
