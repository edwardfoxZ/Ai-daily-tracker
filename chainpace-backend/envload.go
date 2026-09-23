package main

import (
	"bufio"
	"os"
	"strings"
)

func loadDotEnv() {
	paths := []string{".env", "./chainpace-backend/.env"}
	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		sc := bufio.NewScanner(f)
		first := true
		for sc.Scan() {
			line := strings.TrimSpace(sc.Text())
			if first {
				line = strings.TrimPrefix(line, "\ufeff")
				first = false
			}
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			k, v, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}
			k = strings.TrimSpace(strings.TrimPrefix(k, "\ufeff"))
			v = strings.TrimSpace(v)
			v = strings.Trim(v, "\"'")
			if os.Getenv(k) == "" {
				_ = os.Setenv(k, v)
			}
		}
		_ = f.Close()
	}
}
