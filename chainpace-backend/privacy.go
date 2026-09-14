package main

import (
	"encoding/json"
	"net/http"
	"strings"
)

func GetAllowAnyone(userID int64) bool {
	var v int
	err := db.QueryRow(`SELECT COALESCE(allow_anyone_message, 0) FROM users WHERE id = ?`, userID).Scan(&v)
	return err == nil && v == 1
}

func SetAllowAnyone(userID int64, allow bool) error {
	n := 0
	if allow {
		n = 1
	}
	_, err := db.Exec(`UPDATE users SET allow_anyone_message = ? WHERE id = ?`, n, userID)
	return err
}

func AreFriendsSQL(a, b int64) bool {
	if a > b {
		a, b = b, a
	}
	var n int
	err := db.QueryRow(`SELECT 1 FROM friendships WHERE user_a = ? AND user_b = ?`, a, b).Scan(&n)
	return err == nil
}

func UpsertFriendship(a, b int64) error {
	if a == b {
		return nil
	}
	if a > b {
		a, b = b, a
	}
	_, err := db.Exec(`INSERT OR IGNORE INTO friendships (user_a, user_b) VALUES (?, ?)`, a, b)
	return err
}

type settingsBody struct {
	AllowAnyoneMessage *bool `json:"allowAnyoneMessage"`
}

func updateSettingsHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	var req settingsBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body")
		return
	}
	if req.AllowAnyoneMessage != nil {
		_ = SetAllowAnyone(me.ID, *req.AllowAnyoneMessage)
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"allowAnyoneMessage": GetAllowAnyone(me.ID),
	})
}

func getSettingsHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"allowAnyoneMessage": GetAllowAnyone(me.ID),
	})
}

type friendBody struct {
	UserID        int64  `json:"userId"`
	WalletAddress string `json:"walletAddress"`
}

func recordFriendHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	var req friendBody
	_ = json.NewDecoder(r.Body).Decode(&req)
	peerID := req.UserID
	if peerID == 0 && strings.TrimSpace(req.WalletAddress) != "" {
		u, err := FindUserByWallet(strings.TrimSpace(req.WalletAddress))
		if err != nil {
			writeError(w, http.StatusNotFound, "No account for that wallet yet")
			return
		}
		peerID = u.ID
	}
	if peerID == 0 {
		writeError(w, http.StatusBadRequest, "userId or walletAddress required")
		return
	}
	if err := UpsertFriendship(me.ID, peerID); err != nil {
		writeError(w, http.StatusInternalServerError, "Could not save friend")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
