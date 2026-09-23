package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
)

func threadMAC(a, b int64) string {
	lo, hi := a, b
	if b < a {
		lo, hi = b, a
	}
	mac := hmac.New(sha256.New, jwtSecret())
	_, _ = fmt.Fprintf(mac, "thread:%d-%d", lo, hi)
	sum := hex.EncodeToString(mac.Sum(nil))
	if len(sum) > 24 {
		return sum[:24]
	}
	return sum
}

func paceMAC(userID int64) string {
	mac := hmac.New(sha256.New, jwtSecret())
	_, _ = fmt.Fprintf(mac, "pace:%d", userID)
	sum := hex.EncodeToString(mac.Sum(nil))
	if len(sum) > 24 {
		return sum[:24]
	}
	return sum
}

func validThreadSig(meID, peerID int64, sig string) bool {
	if sig == "" {
		return false
	}
	if peerID == 0 {
		return hmac.Equal([]byte(sig), []byte(paceMAC(meID)))
	}
	return hmac.Equal([]byte(sig), []byte(threadMAC(meID, peerID)))
}

func threadLinkHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	withRaw := r.URL.Query().Get("with")
	peerID, err := strconv.ParseInt(withRaw, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "with is required")
		return
	}
	sig := paceMAC(me.ID)
	if peerID != 0 {
		sig = threadMAC(me.ID, peerID)
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"path": fmt.Sprintf("/messages/%d/%s", peerID, sig),
		"id":   peerID,
		"sig":  sig,
	})
}

func threadOpenHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	peerID, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}
	sig := r.URL.Query().Get("sig")
	if !validThreadSig(me.ID, peerID, sig) {
		writeError(w, http.StatusForbidden, "Invalid thread signature")
		return
	}
	if peerID == 0 {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"peer": map[string]interface{}{"id": 0, "username": "Pace"},
			"kind": "agent",
		})
		return
	}
	peer, err := FindUserByID(peerID)
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"peer": peer, "kind": "user"})
}
