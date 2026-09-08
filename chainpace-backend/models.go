package main

import (
	"database/sql"
	"errors"
	"strings"
)

type User struct {
	ID            int64   `json:"id"`
	Username      string  `json:"username"`
	Email         *string `json:"email,omitempty"`
	Phone         *string `json:"phone,omitempty"`
	PasswordHash  *string `json:"-"`
	WalletAddress *string `json:"walletAddress,omitempty"`
	Bio           string  `json:"bio"`
}

type Message struct {
	ID         int64  `json:"id"`
	FromUserID int64  `json:"fromUserId"`
	ToUserID   int64  `json:"toUserId"`
	Body       string `json:"body"`
	CreatedAt  string `json:"createdAt"`
}

var ErrUserExists = errors.New("username, email, or phone already in use")
var ErrUserNotFound = errors.New("user not found")
var ErrInvalidCredentials = errors.New("invalid credentials")

func scanUser(row interface {
	Scan(dest ...any) error
}) (*User, string, error) {
	var u User
	var passwordHash sql.NullString
	var bio sql.NullString
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Phone, &passwordHash, &u.WalletAddress, &bio)
	if err == sql.ErrNoRows {
		return nil, "", ErrUserNotFound
	}
	if err != nil {
		return nil, "", err
	}
	u.Bio = bio.String
	return &u, passwordHash.String, nil
}

func CreateUser(username string, email, phone *string, passwordHash string) (*User, error) {
	res, err := db.Exec(
		`INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)`,
		username, email, phone, passwordHash,
	)
	if err != nil {
		return nil, ErrUserExists
	}
	id, _ := res.LastInsertId()
	return &User{ID: id, Username: username, Email: email, Phone: phone}, nil
}

func CreateWalletUser(username, walletAddress string) (*User, error) {
	res, err := db.Exec(
		`INSERT INTO users (username, wallet_address) VALUES (?, ?)`,
		username, walletAddress,
	)
	if err != nil {
		return nil, ErrUserExists
	}
	id, _ := res.LastInsertId()
	return &User{ID: id, Username: username, WalletAddress: &walletAddress}, nil
}

func FindUserByIdentifier(identifier string) (*User, string, error) {
	row := db.QueryRow(
		`SELECT id, username, email, phone, password_hash, wallet_address, COALESCE(bio,'')
		 FROM users WHERE username = ? OR email = ? OR phone = ?`,
		identifier, identifier, identifier,
	)
	return scanUser(row)
}

func FindUserByWallet(address string) (*User, error) {
	row := db.QueryRow(
		`SELECT id, username, email, phone, password_hash, wallet_address, COALESCE(bio,'')
		 FROM users WHERE lower(wallet_address) = lower(?)`,
		address,
	)
	u, _, err := scanUser(row)
	return u, err
}

func FindUserByID(id int64) (*User, error) {
	row := db.QueryRow(
		`SELECT id, username, email, phone, password_hash, wallet_address, COALESCE(bio,'')
		 FROM users WHERE id = ?`,
		id,
	)
	u, _, err := scanUser(row)
	return u, err
}

func IsUsernameTaken(username string) (bool, error) {
	var exists int
	err := db.QueryRow(`SELECT 1 FROM users WHERE username = ?`, username).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func AttachWalletToUser(userID int64, walletAddress string) error {
	_, err := db.Exec(`UPDATE users SET wallet_address = ? WHERE id = ?`, walletAddress, userID)
	return err
}

func UpdateProfile(userID int64, username, bio string) error {
	username = strings.TrimSpace(username)
	bio = strings.TrimSpace(bio)
	if username == "" {
		_, err := db.Exec(`UPDATE users SET bio = ? WHERE id = ?`, bio, userID)
		return err
	}
	_, err := db.Exec(`UPDATE users SET username = ?, bio = ? WHERE id = ?`, username, bio, userID)
	return err
}

func SearchUsers(q string, limit int) ([]User, error) {
	if limit <= 0 || limit > 20 {
		limit = 10
	}
	like := "%" + strings.ToLower(strings.TrimSpace(q)) + "%"
	rows, err := db.Query(
		`SELECT id, username, email, phone, password_hash, wallet_address, COALESCE(bio,'')
		 FROM users
		 WHERE lower(username) LIKE ? OR lower(COALESCE(wallet_address,'')) LIKE ?
		 ORDER BY username LIMIT ?`,
		like, like, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []User{}
	for rows.Next() {
		u, _, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *u)
	}
	return out, rows.Err()
}

func InsertMessage(fromID, toID int64, body string) (*Message, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return nil, errors.New("empty message")
	}
	res, err := db.Exec(
		`INSERT INTO messages (from_user_id, to_user_id, body) VALUES (?, ?, ?)`,
		fromID, toID, body,
	)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return &Message{ID: id, FromUserID: fromID, ToUserID: toID, Body: body}, nil
}

func ListMessages(userA, userB int64) ([]Message, error) {
	rows, err := db.Query(
		`SELECT id, from_user_id, to_user_id, body, created_at
		 FROM messages
		 WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
		 ORDER BY id ASC`,
		userA, userB, userB, userA,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Message{}
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.FromUserID, &m.ToUserID, &m.Body, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}
