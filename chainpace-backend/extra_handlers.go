package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

func currentUser(r *http.Request) (*User, error) {
	cookie, err := r.Cookie("chainpace_token")
	if err != nil {
		return nil, err
	}
	claims, err := parseToken(cookie.Value)
	if err != nil {
		return nil, err
	}
	return FindUserByID(claims.UserID)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type updateMeRequest struct {
	Username string `json:"username"`
	Bio      string `json:"bio"`
}

func updateMeHandler(w http.ResponseWriter, r *http.Request) {
	user, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	var req updateMeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if err := UpdateProfile(user.ID, req.Username, req.Bio); err != nil {
		writeError(w, http.StatusConflict, "Could not update profile")
		return
	}
	updated, err := FindUserByID(user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to reload user")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": updated})
}

type linkWalletRequest struct {
	WalletAddress string `json:"walletAddress"`
}

func linkWalletHandler(w http.ResponseWriter, r *http.Request) {
	user, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	var req linkWalletRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	req.WalletAddress = strings.TrimSpace(req.WalletAddress)
	if req.WalletAddress == "" {
		writeError(w, http.StatusBadRequest, "walletAddress is required")
		return
	}
	if err := AttachWalletToUser(user.ID, req.WalletAddress); err != nil {
		writeError(w, http.StatusConflict, "Wallet already linked to another account")
		return
	}
	updated, _ := FindUserByID(user.ID)
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": updated})
}

func searchUsersHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := currentUser(r); err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	q := r.URL.Query().Get("q")
	users, err := SearchUsers(q, 12)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Search failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"users": users})
}

func userByWalletHandler(w http.ResponseWriter, r *http.Request) {
	addr := strings.TrimSpace(r.URL.Query().Get("address"))
	if addr == "" {
		writeError(w, http.StatusBadRequest, "address is required")
		return
	}
	user, err := FindUserByWallet(addr)
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": user})
}

func listMessagesHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	withID, err := strconv.ParseInt(r.URL.Query().Get("with"), 10, 64)
	if err != nil || withID == 0 {
		writeError(w, http.StatusBadRequest, "with query param required")
		return
	}
	msgs, err := ListMessages(me.ID, withID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load messages")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"messages": msgs})
}

type sendMessageRequest struct {
	ToUserID int64  `json:"toUserId"`
	Body     string `json:"body"`
}

func sendMessageHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	var req sendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.ToUserID == 0 || req.ToUserID == me.ID {
		writeError(w, http.StatusBadRequest, "Invalid recipient")
		return
	}
	msg, err := InsertMessage(me.ID, req.ToUserID, req.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"message": msg})
}
