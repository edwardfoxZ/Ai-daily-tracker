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

type AgentMessage struct {
	ID        int64  `json:"id"`
	Role      string `json:"role"`
	Body      string `json:"body"`
	State     string `json:"state,omitempty"`
	CTAJSON   string `json:"-"`
	CTA       *CTA   `json:"cta,omitempty"`
	CreatedAt string `json:"createdAt"`
}

type CTA struct {
	ID      int64  `json:"id"`
	Kind    string `json:"kind"`
	Label   string `json:"label"`
	Payload string `json:"payload,omitempty"`
	Status  string `json:"status,omitempty"`
}

type AgentRoutine struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	Trigger    string `json:"trigger"`
	TimeWindow string `json:"timeWindow"`
	HabitsText string `json:"habitsText"`
}

type AgentMemory struct {
	ID   int64  `json:"id"`
	Kind string `json:"kind"`
	Text string `json:"text"`
}

func agentThreadHandler(w http.ResponseWriter, r *http.Request) {
	me, err := currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	ensureWelcome(me.ID)
	msgs, err := listAgentMessages(me.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load coach thread")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"messages": msgs})
}
