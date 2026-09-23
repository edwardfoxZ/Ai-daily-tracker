package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

func ensureWelcome(userID int64) {
	var n int
	_ = db.QueryRow(`SELECT COUNT(*) FROM agent_messages WHERE user_id = ?`, userID).Scan(&n)
	if n > 0 {
		return
	}
	_, _ = insertAgentMessage(userID, "assistant", "I am Pace, your private coach. Tell me what you want to keep this month — gym, money, reading, friends. I will classify it and give one experiment.", "on_track", nil)
}

func insertAgentMessage(userID int64, role, body, state string, cta *CTA) (*AgentMessage, error) {
	ctaJSON := ""
	if cta != nil {
		if cta.ID == 0 {
			res, err := db.Exec(`INSERT INTO agent_ctas (user_id, kind, label, payload, status) VALUES (?, ?, ?, ?, 'pending')`, userID, cta.Kind, cta.Label, cta.Payload)
			if err == nil {
				cta.ID, _ = res.LastInsertId()
			}
		}
		b, _ := json.Marshal(cta)
		ctaJSON = string(b)
	}
	res, err := db.Exec(`INSERT INTO agent_messages (user_id, role, body, state, cta_json) VALUES (?, ?, ?, ?, ?)`, userID, role, body, state, ctaJSON)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return &AgentMessage{ID: id, Role: role, Body: body, State: state, CTA: cta, CreatedAt: time.Now().UTC().Format(time.RFC3339)}, nil
}

func listAgentMessages(userID int64) ([]AgentMessage, error) {
	rows, err := db.Query(`SELECT id, role, body, state, cta_json, created_at FROM agent_messages WHERE user_id = ? ORDER BY id ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AgentMessage{}
	for rows.Next() {
		var m AgentMessage
		if err := rows.Scan(&m.ID, &m.Role, &m.Body, &m.State, &m.CTAJSON, &m.CreatedAt); err != nil {
			continue
		}
		if strings.TrimSpace(m.CTAJSON) != "" {
			var c CTA
			if json.Unmarshal([]byte(m.CTAJSON), &c) == nil {
				_ = db.QueryRow(`SELECT status FROM agent_ctas WHERE id = ?`, c.ID).Scan(&c.Status)
				m.CTA = &c
			}
		}
		out = append(out, m)
	}
	return out, nil
}

func listRoutines(userID int64) ([]AgentRoutine, error) {
	rows, err := db.Query(`SELECT id, name, trigger, time_window, habits_text FROM agent_routines WHERE user_id = ? AND active = 1 ORDER BY id DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AgentRoutine{}
	for rows.Next() {
		var r AgentRoutine
		if rows.Scan(&r.ID, &r.Name, &r.Trigger, &r.TimeWindow, &r.HabitsText) == nil {
			out = append(out, r)
		}
	}
	return out, nil
}

func listMemories(userID int64) ([]AgentMemory, error) {
	rows, err := db.Query(`SELECT id, kind, text FROM agent_memories WHERE user_id = ? ORDER BY id DESC LIMIT 8`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AgentMemory{}
	for rows.Next() {
		var m AgentMemory
		if rows.Scan(&m.ID, &m.Kind, &m.Text) == nil {
			out = append(out, m)
		}
	}
	return out, nil
}

func diagnoseState(userID int64) string {
	var misses, total int
	_ = db.QueryRow(`SELECT COUNT(*) FROM habit_events WHERE user_id = ? AND created_at >= datetime('now', '-14 days')`, userID).Scan(&total)
	_ = db.QueryRow(`SELECT COUNT(*) FROM habit_events WHERE user_id = ? AND status IN ('missed','skipped') AND created_at >= datetime('now', '-14 days')`, userID).Scan(&misses)
	if total >= 4 && misses*2 >= total {
		return "overloaded"
	}
	if misses >= 3 {
		return "broken"
	}
	if misses >= 1 {
		return "slipping"
	}
	return "on_track"
}

func maybeSaveRoutineFromText(userID int64, text string) {
	if len(strings.TrimSpace(text)) < 8 {
		return
	}
	lower := strings.ToLower(text)
	name := "Noted plan"
	if strings.Contains(lower, "morning") {
		name = "Morning stack"
	}
	if strings.Contains(lower, "night") || strings.Contains(lower, "evening") {
		name = "Evening stack"
	}
	_, _ = db.Exec(`INSERT INTO agent_routines (user_id, name, habits_text) VALUES (?, ?, ?)`, userID, name, text)
}

func playbookOnMiss(userID int64, habit string) (string, string, *CTA) {
	state := diagnoseState(userID)
	reply := "Logged the miss on " + habit + ". Do the 2-minute version for 3 days, then the original."
	return reply, state, &CTA{Kind: "shrink_habit", Label: "Try the 7-day smaller version", Payload: habit}
}

func playbookChat(userID int64, userText string) (string, string, *CTA) {
	state := diagnoseState(userID)
	lower := strings.ToLower(userText)
	cat := "mind"
	if classifyHabit != nil {
		cat = classifyHabit(userText)
	}
	label := map[string]string{"mind": "Mind", "money": "Money", "social_credit": "Social credit", "body": "Body"}[cat]
	if label == "" {
		label = "Mind"
	}
	_, _ = db.Exec(`INSERT INTO agent_memories (user_id, kind, text) VALUES (?, 'note', ?)`, userID, userText)

	switch {
	case strings.Contains(lower, "hello") || strings.Contains(lower, "hi ") || lower == "hi" || strings.Contains(lower, "hey"):
		return "Hey. I track four slices: mind, money, social credit, body. What are you trying to keep this week?", state, nil
	case strings.Contains(lower, "why") || strings.Contains(lower, "mindset") || strings.Contains(lower, "analy"):
		return "Mindset here means where your reps actually go. If one slice is empty for a week, that is the gap — not a personality defect. Name one action in the weak slice and I will watch it for 7 days.", state, &CTA{Kind: "shrink_habit", Label: "Watch this for 7 days", Payload: userText}
	case strings.Contains(lower, "skip") || strings.Contains(lower, "can't") || strings.Contains(lower, "cannot") || strings.Contains(lower, "inconsist") || strings.Contains(lower, "fail") || strings.Contains(lower, "hard"):
		return "Got it: “" + clip(userText, 80) + "”. That sits in " + label + ". Shrink it to 5 minutes for 7 days instead of quitting.", state, &CTA{Kind: "shrink_habit", Label: "Shrink it for 7 days", Payload: userText}
	case strings.Contains(lower, "routine") || strings.Contains(lower, "every day") || strings.Contains(lower, "weekdays") || strings.Contains(lower, "plan"):
		return "Saved that under " + label + ". Confirm it as the stack I should protect this week?", state, &CTA{Kind: "save_routine", Label: "Confirm this routine", Payload: userText}
	default:
		return "I filed that under " + label + ": “" + clip(userText, 90) + "”. One experiment: do a tiny version tomorrow at a fixed time. Confirm and I will treat it as a 7-day priority.", state, &CTA{Kind: "save_routine", Label: "Track this for 7 days", Payload: userText}
	}
}

func clip(s string, n int) string {
	s = strings.TrimSpace(s)
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}

func coachReply(userID int64, userText string) (string, string, *CTA) {
	key := strings.TrimSpace(os.Getenv("GROQ_API_KEY"))
	if key == "" {
		log.Println("pace: no GROQ_API_KEY, using playbook")
		return playbookChat(userID, userText)
	}
	reply, state, cta, err := groqCoach(userID, userText, key)
	if err != nil {
		log.Println("pace: groq failed, playbook:", err)
		return playbookChat(userID, userText)
	}
	return reply, state, cta
}

type groqReq struct {
	Model       string    `json:"model"`
	Temperature float64   `json:"temperature"`
	Messages    []groqMsg `json:"messages"`
}
type groqMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}
type groqResp struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func groqCoach(userID int64, userText, key string) (string, string, *CTA, error) {
	state := diagnoseState(userID)
	base := os.Getenv("LLM_BASE_URL")
	if base == "" {
		base = "https://api.groq.com/openai/v1"
	}
	models := []string{os.Getenv("LLM_MODEL"), "llama-3.1-8b-instant", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"}
	system := "You are Pace, a private consistency coach in Chainpace. Always answer the user's last message directly. 2-5 short sentences. Classify as mind, money, social credit, or body when you can. One next action. Never shame. Optional last line: CTA: save_routine | Track this for 7 days"
	var lastErr error
	for _, model := range models {
		model = strings.TrimSpace(model)
		if model == "" {
			continue
		}
		payload, _ := json.Marshal(groqReq{Model: model, Temperature: 0.5, Messages: []groqMsg{
			{Role: "system", Content: system},
			{Role: "user", Content: "Consistency state: " + state + "\nUser said: " + userText},
		}})
		req, err := http.NewRequest(http.MethodPost, strings.TrimRight(base, "/")+"/chat/completions", bytes.NewReader(payload))
		if err != nil {
			lastErr = err
			continue
		}
		req.Header.Set("Authorization", "Bearer "+key)
		req.Header.Set("Content-Type", "application/json")
		res, err := (&http.Client{Timeout: 25 * time.Second}).Do(req)
		if err != nil {
			lastErr = err
			continue
		}
		raw, _ := io.ReadAll(res.Body)
		_ = res.Body.Close()
		var parsed groqResp
		_ = json.Unmarshal(raw, &parsed)
		if parsed.Error != nil && parsed.Error.Message != "" {
			lastErr = simpleError(parsed.Error.Message)
			continue
		}
		if len(parsed.Choices) == 0 {
			lastErr = simpleError(string(raw))
			continue
		}
		content := strings.TrimSpace(parsed.Choices[0].Message.Content)
		if content == "" {
			lastErr = simpleError("empty groq content")
			continue
		}
		cta := parseCTALine(&content)
		log.Println("pace: groq ok model=", model)
		return content, state, cta, nil
	}
	if lastErr == nil {
		lastErr = simpleError("no groq model worked")
	}
	return "", state, nil, lastErr
}

type simpleError string

func (e simpleError) Error() string { return string(e) }

func parseCTALine(content *string) *CTA {
	lines := strings.Split(*content, "\n")
	kept := []string{}
	var cta *CTA
	for _, line := range lines {
		trim := strings.TrimSpace(line)
		if strings.HasPrefix(strings.ToUpper(trim), "CTA:") {
			rest := strings.TrimSpace(trim[4:])
			parts := strings.SplitN(rest, "|", 2)
			kind, label := "save_routine", "Track this for 7 days"
			if len(parts) > 0 && strings.TrimSpace(parts[0]) != "" {
				kind = strings.TrimSpace(parts[0])
			}
			if len(parts) > 1 && strings.TrimSpace(parts[1]) != "" {
				label = strings.TrimSpace(parts[1])
			}
			cta = &CTA{Kind: kind, Label: label, Payload: rest}
			continue
		}
		kept = append(kept, line)
	}
	*content = strings.TrimSpace(strings.Join(kept, "\n"))
	return cta
}
