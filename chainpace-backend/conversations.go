package main

import (
	"net/http"
)

type Conversation struct {
	Peer      User    `json:"peer"`
	LastBody  string  `json:"lastBody"`
	LastAt    string  `json:"lastAt"`
	LastFrom  int64   `json:"lastFromId"`
}

func listConversationsHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	rows, err := db.Query(`
		SELECT m.id, m.from_user_id, m.to_user_id, m.body, m.created_at
		FROM messages m
		WHERE m.id IN (
			SELECT MAX(id) FROM messages
			WHERE from_user_id = ? OR to_user_id = ?
			GROUP BY CASE WHEN from_user_id < to_user_id THEN from_user_id ELSE to_user_id END,
			CASE WHEN from_user_id < to_user_id THEN to_user_id ELSE from_user_id END
		)
		ORDER BY m.id DESC
	`, me.ID, me.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load inbox")
		return
	}
	defer rows.Close()

	out := []Conversation{}
	for rows.Next() {
		var id, fromID, toID int64
		var body, created string
		if err := rows.Scan(&id, &fromID, &toID, &body, &created); err != nil {
			continue
		}
		peerID := toID
		if toID == me.ID {
			peerID = fromID
		}
		peer, err := FindUserByID(peerID)
		if err != nil {
			continue
		}
		out = append(out, Conversation{Peer: *peer, LastBody: body, LastAt: created, LastFrom: fromID})
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"conversations": out})
}
