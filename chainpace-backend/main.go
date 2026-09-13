package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, relying on real environment variables")
	}

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

	mux.HandleFunc("GET /api/users/search", searchUsersHandler)
	mux.HandleFunc("GET /api/users/by-wallet", userByWalletHandler)

	mux.HandleFunc("GET /api/messages", listMessagesHandler)
	mux.HandleFunc("POST /api/messages", sendMessageHandler)
	mux.HandleFunc("GET /api/conversations", listConversationsHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("🚀 Chainpace backend running at http://localhost:" + port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(mux)))
}
