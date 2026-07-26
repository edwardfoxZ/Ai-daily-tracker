package main

import "net/http"

// corsMiddleware allows your Next.js dev server (localhost:3000) to call this
// API with credentials (cookies). Update allowedOrigin for production.
func corsMiddleware(next http.Handler) http.Handler {
	allowedOrigin := "http://localhost:3000"

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
