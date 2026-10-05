package main

import (
	"net/http"
	"strings"
)

func ensureCoachPlans() {
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS coach_plans (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		title TEXT NOT NULL,
		when_text TEXT NOT NULL DEFAULT '',
		category TEXT NOT NULL DEFAULT 'mind',
		active INTEGER NOT NULL DEFAULT 1,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`)
}

func saveCoachPlan(userID int64, title, whenText, category string) {
	ensureCoachPlans()
	title = strings.TrimSpace(title)
	if title == "" {
		return
	}
	if category == "" {
		category = classifyHabit(title + " " + whenText)
	}
	_, _ = db.Exec(`INSERT INTO coach_plans (user_id, title, when_text, category) VALUES (?, ?, ?, ?)`, userID, title, whenText, category)
	_, _ = db.Exec(`INSERT INTO agent_routines (user_id, name, trigger, time_window, habits_text) VALUES (?, ?, ?, ?, ?)`, userID, title, "coach", whenText, title+" @ "+whenText)
}

func listCoachPlans(userID int64) []map[string]interface{} {
	ensureCoachPlans()
	rows, err := db.Query(`SELECT id, title, when_text, category, created_at FROM coach_plans WHERE user_id = ? AND active = 1 ORDER BY id DESC LIMIT 12`, userID)
	if err != nil {
		return nil
	}
	defer rows.Close()
	out := []map[string]interface{}{}
	for rows.Next() {
		var id int64
		var title, whenText, category, created string
		if rows.Scan(&id, &title, &whenText, &category, &created) == nil {
			out = append(out, map[string]interface{}{"id": id, "title": title, "when": whenText, "category": category, "createdAt": created})
		}
	}
	return out
}

func coachPlansHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"plans": listCoachPlans(me.ID)})
}

func extractPlan(text string) (title, whenText string, ok bool) {
	lower := strings.ToLower(text)
	if looksLikeQuestion(text) {
		return "", "", false
	}
	want := strings.Contains(lower, "i want") || strings.Contains(lower, "i will") || strings.Contains(lower, "add habit") || strings.Contains(lower, "remind me") || strings.Contains(lower, "every")
	if !want {
		return "", "", false
	}
	whenText = "daily"
	switch {
	case strings.Contains(lower, "morning"):
		whenText = "mornings"
	case strings.Contains(lower, "evening") || strings.Contains(lower, "night"):
		whenText = "evenings"
	case strings.Contains(lower, "weekday"):
		whenText = "weekdays"
	case strings.Contains(lower, "weekend"):
		whenText = "weekends"
	}
	for _, tok := range []string{"7am", "8am", "6am", "9pm", "after work", "after coffee"} {
		if strings.Contains(lower, tok) {
			whenText = tok + " · " + whenText
			break
		}
	}
	title = strings.TrimSpace(text)
	if len(title) > 72 {
		title = title[:72]
	}
	return title, whenText, true
}
