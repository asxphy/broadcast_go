package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
)

func CreateChannel(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name string `json:"name"`

			Description string `json:"description"`
			IsPrivate   bool   `json:"is_private"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid body", 400)
			return
		}

		userId := r.Context().Value("user_id").(string)
		channelID := uuid.NewString()

		_, err := db.Exec(`
		INSERT INTO channels (id, owner_id, name, description, is_private, created_at)
			VALUES ($1, $2, $3, $4, $5, NOW())
		`, channelID, userId, req.Name, req.Description, req.IsPrivate)

		if err != nil {
			http.Error(w, "db error", 500)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"channel_id": channelID,
		})
	}
}

func FollowChannel(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("user_id").(string)
		channelID := chi.URLParam(r, "id")

		_, err := db.Exec(`
		INSERT INTO channel_followers (user_id, channel_id, followed_at)
			VALUES ($1, $2, NOW())
			ON CONFLICT DO NOTHING
		`, userID, channelID)

		if err != nil {
			http.Error(w, "db error", 500)
		}

		w.WriteHeader(http.StatusOK)
	}
}

func UnFollowChannel(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("user_id").(string)
		channelID := chi.URLParam(r, "id")

		_, err := db.Exec(`
			Delete From channel_followers
			where user_id = $1 and channel_id = $2
		`, userID, channelID)

		if err != nil {
			http.Error(w, "db error", 500)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}
