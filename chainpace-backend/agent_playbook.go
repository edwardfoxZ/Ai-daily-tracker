package main

import "strings"

func looksLikeQuestion(text string) bool {
	lower := strings.ToLower(strings.TrimSpace(text))
	if strings.HasSuffix(lower, "?") {
		return true
	}
	for _, s := range []string{"what ", "why ", "how ", "when ", "where ", "who "} {
		if strings.HasPrefix(lower, s) {
			return true
		}
	}
	return strings.Contains(lower, "happened") && !strings.Contains(lower, "i want")
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
	default:
		words := strings.Fields(strings.TrimSpace(text))
		if len(words) == 0 {
			return "Routine"
		}
		if len(words) > 4 {
			words = words[:4]
		}
		return strings.Join(words, " ")
	}
}

func maybeSaveRoutineFromText(userID int64, text string) {
	title, whenText, ok := extractPlan(text)
	if !ok {
		return
	}
	saveCoachPlan(userID, shortRoutineName(title), whenText, classifyHabit(text))
}

func playbookChat(userID int64, userText string) (string, string, *CTA) {
	state := diagnoseState(userID)
	lower := strings.ToLower(userText)
	if looksLikeQuestion(userText) {
		plans := listCoachPlans(userID)
		return "Ask me to add a habit and a time. Example: I want to gym at 7am on weekdays. I have " + itoa(len(plans)) + " coach plans saved.", state, nil
	}
	title, whenText, ok := extractPlan(userText)
	if ok {
		cat := classifyHabit(userText)
		saveCoachPlan(userID, shortRoutineName(title), whenText, cat)
		return "Added to your coach timeline: " + shortRoutineName(title) + " · " + whenText + " (" + cat + "). I will treat this as the plan to protect. Confirm if you want it locked for 7 days.", state, &CTA{Kind: "save_routine", Label: "Lock this plan for 7 days", Payload: title}
	}
	if strings.Contains(lower, "hello") || lower == "hi" || strings.Contains(lower, "hey") {
		return "Tell me the habit and when it fits your day. I will put it on your timeline.", state, nil
	}
	return "I can add that as a habit if you say when. Try: I want to read 10 minutes after coffee.", state, nil
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := "0123456789"
	out := ""
	for n > 0 {
		out = digits[n%10:n%10+1] + out
		n /= 10
	}
	return out
}
