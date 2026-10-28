package main

import (
	"net/http"
	"os"
)

const cookieMaxAge = 60 * 60 * 24 * 4

func setAuthCookie(w http.ResponseWriter, token string) {
	secure := os.Getenv("COOKIE_SECURE") == "1" || os.Getenv("RENDER") == "true"
	same := http.SameSiteLaxMode
	if secure {
		same = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "chainpace_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: same,
		MaxAge:   cookieMaxAge,
	})
}
