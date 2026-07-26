package main

import (
	"log"
	"net/http"
)

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/auth/signup", signupHandler)
	mux.HandleFunc("POST /api/auth/login", loginHandler)
	mux.HandleFunc("POST /api/auth/wallet", walletAuthHandler)
	mux.HandleFunc("GET /api/auth/check-username", checkUsernameHandler)
	mux.HandleFunc("GET /api/auth/me", meHandler)
	mux.HandleFunc("POST /api/auth/logout", logoutHandler)

	handler := corsMiddleware(mux)

	log.Println("🚀 Chainpace backend running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
