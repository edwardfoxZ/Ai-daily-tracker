package main

import "net/http"

// corsMiddleware allows your Next.js dev server (localhost:3000) to call this
// API with credentials (cookies). Update allowedOrigin for production.
func corsMiddleware(next http.Handler) http.Handler {
	allowedOrigins := map[string]bool{
		"http://localhost:3000":              true,
		"https://esthertrackerai.vercel.app": true,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

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
