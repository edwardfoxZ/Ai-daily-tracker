package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func sendOTPEmail(toEmail, otp string) error {
	payload := map[string]interface{}{
		"from":    os.Getenv("EMAIL_FROM"),
		"to":      []string{toEmail},
		"subject": "Your Chainpace verification code",
		"html":    fmt.Sprintf("<p>Your verification code is: <b>%s</b></p><p>It expires in 10 minutes.</p>", otp),
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+os.Getenv("RESEND_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("email provider returned status %d", resp.StatusCode)
	}
	return nil
}
