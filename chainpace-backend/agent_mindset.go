package main

import (
	"net/http"
	"strings"
)

var categoryKeywords = map[string][]string{
	"mind":          {"read", "journal", "meditat", "study", "learn", "write", "focus", "deep work", "course", "mind"},
	"money":         {"save", "budget", "invest", "invoice", "money", "finance", "crypto", "spend", "ledger"},
	"social_credit": {"call", "friend", "message", "network", "mentor", "family", "social", "thank", "community"},
	"body":          {"gym", "run", "walk", "workout", "sleep", "water", "protein", "stretch", "yoga", "body", "health", "steps"},
}

func classifyHabit(name string) string {
	lower := strings.ToLower(name)
	best := "mind"
	hits := 0
	for cat, words := range categoryKeywords {
		n := 0
		for _, w := range words {
			if strings.Contains(lower, w) {
				n++
			}
		}
		if n > hits {
			hits = n
			best = cat
		}
	}
	return best
}

type categoryStat struct {
	Key          string `json:"key"`
	Label        string `json:"label"`
	Completions  int    `json:"completions"`
	Misses       int    `json:"misses"`
	Share        int    `json:"share"`
}

type priorityItem struct {
	Name       string `json:"name"`
	Category   string `json:"category"`
	DaysActive int    `json:"daysActive"`
}

func agentMindsetHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	labels := map[string]string{"mind": "Mind", "money": "Money", "social_credit": "Social credit", "body": "Body"}
	stats := map[string]*categoryStat{
		"mind":          {Key: "mind", Label: labels["mind"]},
		"money":         {Key: "money", Label: labels["money"]},
		"social_credit": {Key: "social_credit", Label: labels["social_credit"]},
		"body":          {Key: "body", Label: labels["body"]},
	}
	rows, err := db.Query(`SELECT habit_name, status, COUNT(*) FROM habit_events WHERE user_id = ? AND created_at >= datetime('now', '-14 days') GROUP BY habit_name, status`, me.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load mindset")
		return
	}
	defer rows.Close()
	habitDays := map[string]int{}
	totalDone := 0
	for rows.Next() {
		var name, status string
		var n int
		if rows.Scan(&name, &status, &n) != nil {
			continue
		}
		cat := classifyHabit(name)
		if status == "completed" {
			stats[cat].Completions += n
			habitDays[name] += n
			totalDone += n
		} else {
			stats[cat].Misses += n
		}
	}
	order := []string{"mind", "money", "social_credit", "body"}
	outStats := []categoryStat{}
	weak, strong := "mind", "mind"
	weakScore, strongScore := 1<<30, -1
	for _, k := range order {
		s := stats[k]
		if totalDone > 0 {
			s.Share = (s.Completions * 100) / totalDone
		}
		outStats = append(outStats, *s)
		if s.Completions < weakScore {
			weakScore = s.Completions
			weak = k
		}
		if s.Completions > strongScore {
			strongScore = s.Completions
			strong = k
		}
	}
	priorities := []priorityItem{}
	for name, days := range habitDays {
		if days >= 7 {
			priorities = append(priorities, priorityItem{Name: name, Category: classifyHabit(name), DaysActive: days})
		}
	}
	analysis := mindsetCopy(labels[strong], labels[weak], totalDone, len(priorities))
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"categories": outStats, "priorities": priorities, "strong": strong, "weak": weak,
		"analysis": analysis, "totalDone14": totalDone,
	})
}

func mindsetCopy(strong, weak string, done, keptWeek int) string {
	if done == 0 {
		return "No logged week yet. Name plans with mind, money, social, or body words — Pace will show which slice you actually feed."
	}
	if strong == weak {
		return "Your week is concentrated in " + strong + ". Add one tiny plan in another category so the chart does not lie next week."
	}
	if keptWeek == 0 {
		return "Nothing has crossed a full week yet. " + strong + " is loudest. " + weak + " is the leak. Keep one " + strings.ToLower(weak) + " action for 7 days."
	}
	return "Kept-for-a-week items are your real priorities. " + strong + " is getting the reps. " + weak + " is underfed — that is the mindset gap."
}
