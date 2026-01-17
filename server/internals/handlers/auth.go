package handlers

import (
	"database/sql"
	"encoding/json"
	"my-app/server/internals/utils"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func SignUp(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		json.NewDecoder(r.Body).Decode(&req)

		hash, err := utils.HashPasswrod(req.Password)
		if err != nil {
			http.Error(w, "hash error", 500)
			return
		}

		var count int
		err = db.QueryRow("SELECT COUNT(*) FROM users WHERE email=$1", req.Email).Scan(&count)

		if count > 0 {
			http.Error(w, "email already exists", 400)
			return
		}

		if err != nil {
			http.Error(w, "database error", 500)
			return
		}

		_, err = db.Exec("INSERT INTO users (email, password) VALUES ($1, $2)", req.Email, hash)

		if err != nil {
			http.Error(w, "database error", 400)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

func Login(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		json.NewDecoder(r.Body).Decode(&req)
		var email string
		var hash string

		err := db.QueryRow(
			"Select email, password FROM users where email=$1", req.Email,
		).Scan(&email, &hash)

		if err != nil {
			http.Error(w, "invalid credentials", 400)
			return
		}
		if utils.CheckPassword(hash, req.Password) != nil {
			http.Error(w, "invalid credentials", 401)
			return
		}

		access_token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id": email,
			"exp":     time.Now().Add(15 * time.Minute).Unix(),
		}).SignedString(utils.Secret())

		refresh_token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id": email,
			"exp":     time.Now().Add(30 * 24 * time.Hour).Unix(),
		}).SignedString(utils.Secret())
		http.SetCookie(w, &http.Cookie{
			Name:     "access_token",
			Value:    access_token,
			HttpOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})

		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    refresh_token,
			HttpOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "login successful",
		})
	}
}

func AuthDetails() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("access_token")
		if err != nil || cookie.Value == "" {
			http.Error(w, "missing token", 401)
			return
		}

		token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (interface{}, error) {
			return utils.Secret(), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "invalid token", 401)
			return
		}
		claims := token.Claims.(jwt.MapClaims)
		email := claims["user_id"].(string)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		json.NewEncoder(w).Encode(map[string]string{
			"email": email,
		})

	}
}

func Logout() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    "",
			HttpOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})

		http.SetCookie(w, &http.Cookie{
			Name:     "access_token",
			Value:    "",
			HttpOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})
	}
}
func Refresh() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("refresh_token")
		if err != nil || cookie.Value == "" {
			http.Error(w, "re login required", 401)
			return
		}

		token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (interface{}, error) {
			return utils.Secret(), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "re login required", 401)
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		email := claims["user_id"]

		newAccess, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id": email,
			"exp":     time.Now().Add(15 * time.Minute).Unix(),
		}).SignedString(utils.Secret())

		http.SetCookie(w, &http.Cookie{
			Name:     "access_token",
			Value:    newAccess,
			HttpOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})

		w.WriteHeader(http.StatusOK)
	}
}
