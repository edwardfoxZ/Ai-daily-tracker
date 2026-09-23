package main

import (
	"strings"
)

func looksLikeQuestion(text string) bool {
	lower := strings.ToLower(strings.TrimSpace(text))
	if strings.HasSuffix(lower, "?") {
		return true
	}
	starts := []string{"what", "why", "how", "when", "where", "who", "did", "do you", "can you", "happened"}
	for _, s := range starts {
		if strings.HasPrefix(lower, s) || strings.Contains(lower, "happened") {
			return true
		}
	}
	return false
}

func shortRoutineName(text string) string {
	lower := strings.ToLower(text)
	switch {
	case strings.Contains(lower, "gym"), strings.Contains(lower, "run"), strings.Contains(lower, "workout"):
		return "Body"
	case strings.Contains(lower, "save"), strings.Contains(lower, "budget"), strings.Contains(lower, "money"):
		return "Money"
	case strings.Contains(lower, "call"), strings.Contains(lower, "friend"):
		return "Social"
	case strings.Contains(lower, "read"), strings.Contains(lower, "journal"):
		return "Mind"
	case strings.Contains(lower, "morning"):
		return "Morning stack"
	default:
		words := strings.Fields(strings.TrimSpace(text))
		if len(words) == 0 {
			return "Routine"
		}
		if len(words) > 3 {
			words = words[:3]
		}
		return strings.Join(words, " ")
	}
}

func maybeSaveRoutineFromText(userID int64, text string) {
	lower := strings.ToLower(text)
	if looksLikeQuestion(text) {
		return
	}
	if !(strings.Contains(lower, "every day") || strings.Contains(lower, "weekdays") || strings.Contains(lower, "routine") || strings.Contains(lower, "i will") || strings.Contains(lower, "i want to")) {
		return
	}
	_, _ = db.Exec(`INSERT INTO agent_routines (user_id, name, habits_text) VALUES (?, ?, ?)`, userID, shortRoutineName(text), text)
}

func playbookChat(userID int64, userText string) (string, string, *CTA) {
	state := diagnoseState(userID)
	lower := strings.ToLower(userText)

	if looksLikeQuestion(userText) || strings.Contains(lower, "happened") {
		routines, _ := listRoutines(userID)
		n := len(routines)
		return "Nothing broke on-chain. The last replies were the offline playbook because Groq did not answer. I also stopped auto-saving every sentence as \u201cNoted plan\u201d — that chip was junk. You have " + itoa(n) + " real routines saved. Tell me a habit you want to keep (gym, budget, reading) and I will only store it when you confirm.", state, nil
	}

	if strings.Contains(lower, "hello") || strings.Contains(lower, "hi ") || lower == "hi" || strings.Contains(lower, "hey") {
		return "Hey. Four slices: mind, money, social credit, body. Say one thing you want to keep this week.", state, nil
	}

	cat := classifyHabit(userText)
	label := map[string]string{"mind": "Mind", "money": "Money", "social_credit": "Social credit", "body": "Body"}[cat]
	if strings.Contains(lower, "skip") || strings.Contains(lower, "can't") || strings.Contains(lower, "cannot") || strings.Contains(lower, "inconsist") || strings.Contains(lower, "fail") || strings.Contains(lower, "hard") {
		return "That sits in " + label + ". Shrink it to 5 minutes for 7 days instead of dropping it.", state, &CTA{Kind: "shrink_habit", Label: "Shrink it for 7 days", Payload: userText}
	}
	if strings.Contains(lower, "routine") || strings.Contains(lower, "every day") || strings.Contains(lower, "i want") || strings.Contains(lower, "i will") {
		return "I can save this under " + label + ". Confirm and it becomes a real routine chip — not a ghost \u201cNoted plan\u201d.", state, &CTA{Kind: "save_routine", Label: "Save this routine", Payload: userText}
	}
	return "I hear: " + clip(userText, 100) + ". If that is a habit, say so and hit Save. If it was a question, ask it again in one line.", state, &CTA{Kind: "save_routine", Label: "Save as routine", Payload: userText}
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := "0123456789"
	if n < 10 {
		return digits[n : n+1]
	}
	out := ""
	for n > 0 {
		out = digits[n%10:n%10+1] + out
		n /= 10
	}
	return out
}
