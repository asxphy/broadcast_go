package handlers

import (
	"database/sql"
	"encoding/json"
	"my-app/server/internals/utils"
	"net/http"
)

func SignUp(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
			Email    string `json:"emai"`
			Password string `json:"password"`
		}

		json.NewDecoder(r.Body).Decode(&req)

		var id int
		var hash string

		err := db.QueryRow(
			"Select id, password FROM users where email=$1", req.Email,
		).Scan(&id, &hash)

		if err != nil {
			http.Error(w, "invalid credentials", 400)
			return
		}

		if utils.CheckPassword(hash, req.Password) != nil {
			http.Error(w, "invalid credentials", 401)
			return
		}

		token, _ := utils.GenerateJWT(id)

		json.NewEncoder(w).Encode(map[string]string{
			"token": token,
		})
	}
}
