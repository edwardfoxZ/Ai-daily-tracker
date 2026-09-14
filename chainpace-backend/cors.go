package main

import (
	"net/http"
	"os"
	"strings"
)

func allowOrigin(origin string) bool {
	if origin == "" {
		return false
	}
	if origin == "http://localhost:3000" || origin == "https://esthertrackerai.vercel.app" {
		return true
	}
	if extra := os.Getenv("CORS_ORIGIN"); extra != "" {
		for _, o := range strings.Split(extra, ",") {
			if strings.TrimSpace(o) == origin {
				return true
			}
		}
	}
	// Phone testing on the same Wi-Fi: http://192.168.x.x:3000
	if strings.HasPrefix(origin, "http://192.168.") || strings.HasPrefix(origin, "http://10.") || strings.HasPrefix(origin, "http://127.0.0.1") {
		return true
	}
	if strings.HasPrefix(origin, "http://localhost:") {
		return true
	}
	return false
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
