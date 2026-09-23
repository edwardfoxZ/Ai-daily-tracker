package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	loadDotEnv()
	initDB()
	defer db.Close()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", healthHandler)

	mux.HandleFunc("POST /api/auth/signup", signupHandler)
	mux.HandleFunc("POST /api/auth/login", loginHandler)
	mux.HandleFunc("POST /api/auth/wallet", walletAuthHandler)
	mux.HandleFunc("POST /api/auth/request-otp", requestOtpHandler)
	mux.HandleFunc("POST /api/auth/verify-otp", verifyOtpHandler)
	mux.HandleFunc("GET /api/auth/check-username", checkUsernameHandler)
	mux.HandleFunc("GET /api/auth/me", meHandler)
	mux.HandleFunc("POST /api/auth/logout", logoutHandler)

	mux.HandleFunc("PATCH /api/me", updateMeHandler)
	mux.HandleFunc("POST /api/me/wallet", linkWalletHandler)
	mux.HandleFunc("GET /api/me/settings", getSettingsHandler)
	mux.HandleFunc("PATCH /api/me/settings", updateSettingsHandler)
	mux.HandleFunc("POST /api/friends", recordFriendHandler)

	mux.HandleFunc("GET /api/users/search", searchUsersHandler)
	mux.HandleFunc("GET /api/users/by-wallet", userByWalletHandler)

	mux.HandleFunc("GET /api/messages", listMessagesHandler)
	mux.HandleFunc("POST /api/messages", sendMessageHandler)
	mux.HandleFunc("GET /api/conversations", listConversationsHandler)

	mux.HandleFunc("GET /api/agent/thread", agentThreadHandler)
	mux.HandleFunc("POST /api/agent/chat", agentChatHandler)
	mux.HandleFunc("POST /api/agent/event", agentEventHandler)
	mux.HandleFunc("POST /api/agent/cta", agentCtaHandler)
	mux.HandleFunc("GET /api/agent/profile", agentProfileHandler)
	mux.HandleFunc("GET /api/agent/mindset", agentMindsetHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("🚀 Chainpace backend running at http://0.0.0.0:" + port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(mux)))
}
