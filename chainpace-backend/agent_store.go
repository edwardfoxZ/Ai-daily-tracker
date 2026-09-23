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
	_, _ = insertAgentMessage(userID, "assistant", "I am Pace, your private coach. Tell me the 1-3 things you want to keep this month. I will save them as a routine and watch consistency.", "on_track", nil)
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
	lower := strings.ToLower(text)
	if !(strings.Contains(lower, "routine") || strings.Contains(lower, "every day") || strings.Contains(lower, "weekdays") || strings.Contains(lower, "after coffee")) {
		return
	}
	name := "Personal routine"
	if strings.Contains(lower, "morning") {
		name = "Morning stack"
	}
	_, _ = db.Exec(`INSERT INTO agent_routines (user_id, name, habits_text) VALUES (?, ?, ?)`, userID, name, text)
}

func playbookOnMiss(userID int64, habit string) (string, string, *CTA) {
	state := diagnoseState(userID)
	reply := "Logged the miss on " + habit + ". Smallest version for 3 days, then the original."
	return reply, state, &CTA{Kind: "shrink_habit", Label: "Try the 7-day smaller version", Payload: habit}
}

func playbookChat(userID int64, userText string) (string, string, *CTA) {
	state := diagnoseState(userID)
	lower := strings.ToLower(userText)
	if strings.Contains(lower, "routine") || strings.Contains(lower, "weekdays") {
		return "Saved that as a routine. Confirm it as your official stack?", state, &CTA{Kind: "save_routine", Label: "Confirm this routine", Payload: userText}
	}
	if strings.Contains(lower, "skip") || strings.Contains(lower, "inconsist") || strings.Contains(lower, "fail") {
		_, _ = db.Exec(`INSERT INTO agent_memories (user_id, kind, text) VALUES (?, 'blocker', ?)`, userID, userText)
		return "That is a blocker, not a character flaw. Shrink it for 7 days?", state, &CTA{Kind: "shrink_habit", Label: "Shrink it for 7 days", Payload: userText}
	}
	return "Tell me the habit and when it usually breaks. I will save it and give one experiment.", state, nil
}

func coachReply(userID int64, userText string) (string, string, *CTA) {
	if os.Getenv("GROQ_API_KEY") == "" {
		return playbookChat(userID, userText)
	}
	reply, state, cta, err := groqCoach(userID, userText)
	if err != nil {
		log.Println("groq coach fallback:", err)
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

func groqCoach(userID int64, userText string) (string, string, *CTA, error) {
	state := diagnoseState(userID)
	base := os.Getenv("LLM_BASE_URL")
	if base == "" {
		base = "https://api.groq.com/openai/v1"
	}
	model := os.Getenv("LLM_MODEL")
	if model == "" {
		model = "openai/gpt-oss-20b"
	}
	system := "You are Pace, a private consistency coach. 2-5 short sentences. One next action. Never shame. Optional last line: CTA: shrink_habit | Try the 7-day smaller version"
	payload, _ := json.Marshal(groqReq{Model: model, Temperature: 0.4, Messages: []groqMsg{{Role: "system", Content: system}, {Role: "user", Content: "State: " + state + "\nUser: " + userText}}})
	req, err := http.NewRequest(http.MethodPost, strings.TrimRight(base, "/")+"/chat/completions", bytes.NewReader(payload))
	if err != nil {
		return "", state, nil, err
	}
	req.Header.Set("Authorization", "Bearer "+os.Getenv("GROQ_API_KEY"))
	req.Header.Set("Content-Type", "application/json")
	res, err := (&http.Client{Timeout: 25 * time.Second}).Do(req)
	if err != nil {
		return "", state, nil, err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	var parsed groqResp
	_ = json.Unmarshal(raw, &parsed)
	if parsed.Error != nil && parsed.Error.Message != "" {
		return "", state, nil, simpleError(parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return "", state, nil, simpleError(string(raw))
	}
	content := strings.TrimSpace(parsed.Choices[0].Message.Content)
	cta := parseCTALine(&content)
	return content, state, cta, nil
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
			kind, label := "shrink_habit", "Confirm this experiment"
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
