package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var secret = []byte("key")

func Secret() []byte {
	return secret
}

func GenerateJWT(userID string, name string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"name":    name,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}
