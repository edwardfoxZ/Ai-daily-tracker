package main

import (
	"database/sql"
	"errors"
)

type User struct {
	ID            int64   `json:"id"`
	Username      string  `json:"username"`
	Email         *string `json:"email,omitempty"`
	Phone         *string `json:"phone,omitempty"`
	PasswordHash  *string `json:"-"`
	WalletAddress *string `json:"walletAddress,omitempty"`
}

var ErrUserExists = errors.New("username, email, or phone already in use")
var ErrUserNotFound = errors.New("user not found")
var ErrInvalidCredentials = errors.New("invalid credentials")

// CreateUser inserts a new user with a hashed password (email/phone signup).
func CreateUser(username string, email, phone *string, passwordHash string) (*User, error) {
	res, err := db.Exec(
		`INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)`,
		username, email, phone, passwordHash,
	)
	if err != nil {
		return nil, ErrUserExists // UNIQUE constraint violation lands here
	}
	id, _ := res.LastInsertId()
	return &User{ID: id, Username: username, Email: email, Phone: phone}, nil
}

// CreateWalletUser inserts a new user identified only by wallet address (no password).
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

// FindUserByIdentifier looks up a user by username, email, or phone.
func FindUserByIdentifier(identifier string) (*User, string, error) {
	row := db.QueryRow(
		`SELECT id, username, email, phone, password_hash, wallet_address
		 FROM users WHERE username = ? OR email = ? OR phone = ?`,
		identifier, identifier, identifier,
	)
	var u User
	var passwordHash sql.NullString
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Phone, &passwordHash, &u.WalletAddress)
	if err == sql.ErrNoRows {
		return nil, "", ErrUserNotFound
	}
	if err != nil {
		return nil, "", err
	}
	return &u, passwordHash.String, nil
}

// FindUserByWallet looks up a user by wallet address.
func FindUserByWallet(address string) (*User, error) {
	row := db.QueryRow(
		`SELECT id, username, email, phone, wallet_address FROM users WHERE wallet_address = ?`,
		address,
	)
	var u User
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Phone, &u.WalletAddress)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindUserByID looks up a user by their numeric ID.
func FindUserByID(id int64) (*User, error) {
	row := db.QueryRow(
		`SELECT id, username, email, phone, wallet_address FROM users WHERE id = ?`,
		id,
	)
	var u User
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Phone, &u.WalletAddress)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// IsUsernameTaken checks availability while the user is typing.
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

// AttachWalletToUser links a wallet address to an existing email/phone account.
func AttachWalletToUser(userID int64, walletAddress string) error {
	_, err := db.Exec(`UPDATE users SET wallet_address = ? WHERE id = ?`, walletAddress, userID)
	return err
}
