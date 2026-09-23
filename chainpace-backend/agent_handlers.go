package main

import (
	"encoding/json"
	"net/http"
	"strings"
)

func agentProfileHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	_, _ = db.Exec(`UPDATE agent_routines SET active = 0 WHERE user_id = ? AND name IN ('Noted plan', 'Saved routine') AND length(habits_text) < 12`, me.ID)
	_, _ = db.Exec(`UPDATE agent_routines SET active = 0 WHERE user_id = ? AND name = 'Noted plan'`, me.ID)
	routines, _ := listRoutines(me.ID)
	memories, _ := listMemories(me.ID)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"state":    diagnoseState(me.ID),
		"routines": routines,
		"memories": memories,
	})
}

type agentChatReq struct {
	Message string `json:"message"`
}

func agentChatHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	var req agentChatReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		writeError(w, http.StatusBadRequest, "message is required")
		return
	}
	userText := strings.TrimSpace(req.Message)
	if _, err := insertAgentMessage(me.ID, "user", userText, "", nil); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save message")
		return
	}
	reply, state, cta := coachReply(me.ID, userText)
	saved, err := insertAgentMessage(me.ID, "assistant", reply, state, cta)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save reply")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": saved, "state": state, "cta": saved.CTA})
}

type agentEventReq struct {
	HabitName string `json:"habitName"`
	Status    string `json:"status"`
	Note      string `json:"note"`
}

func agentEventHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	var req agentEventReq
	_ = json.NewDecoder(r.Body).Decode(&req)
	req.HabitName = strings.TrimSpace(req.HabitName)
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))
	if req.HabitName == "" {
		req.HabitName = "habit"
	}
	if req.Status == "" {
		req.Status = "completed"
	}
	_, _ = db.Exec(`INSERT INTO habit_events (user_id, habit_name, status, note) VALUES (?, ?, ?, ?)`, me.ID, req.HabitName, req.Status, req.Note)
	notify := false
	var msg *AgentMessage
	if req.Status == "missed" || req.Status == "skipped" {
		reply, state, cta := playbookOnMiss(me.ID, req.HabitName)
		saved, err := insertAgentMessage(me.ID, "assistant", reply, state, cta)
		if err == nil {
			msg = saved
			notify = true
		}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "notify": notify, "state": diagnoseState(me.ID), "message": msg})
}

type agentCtaReq struct {
	ID     int64 `json:"id"`
	Accept bool  `json:"accept"`
}

func agentCtaHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	var req agentCtaReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == 0 {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}
	status := "declined"
	if req.Accept {
		status = "accepted"
	}
	res, err := db.Exec(`UPDATE agent_ctas SET status = ? WHERE id = ? AND user_id = ? AND status = 'pending'`, status, req.ID, me.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Could not update experiment")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeError(w, http.StatusNotFound, "Experiment not found")
		return
	}
	body := "Okay — keeping the original plan."
	if req.Accept {
		var kind, payload string
		_ = db.QueryRow(`SELECT kind, payload FROM agent_ctas WHERE id = ?`, req.ID).Scan(&kind, &payload)
		if kind == "save_routine" && payload != "" && !looksLikeQuestion(payload) {
			name := shortRoutineName(payload)
			_, _ = db.Exec(`INSERT INTO agent_routines (user_id, name, habits_text) VALUES (?, ?, ?)`, me.ID, name, payload)
		}
		if payload != "" {
			_, _ = db.Exec(`INSERT INTO agent_memories (user_id, kind, text) VALUES (?, 'commitment', ?)`, me.ID, payload)
		}
		body = "Locked in for 7 days. I will watch this and only nudge if it slips."
	}
	saved, _ := insertAgentMessage(me.ID, "assistant", body, diagnoseState(me.ID), nil)
	writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "message": saved, "accepted": req.Accept})
}
