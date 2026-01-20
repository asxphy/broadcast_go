package handlers

import (
	"database/sql"
	"encoding/json"
	"my-app/server/internals/auth"
	"my-app/server/internals/utils"
	"net/http"

	"github.com/google/uuid"
)

func GetChannel(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, _ := r.Context().Value(auth.UserIDKey).(string)
		var req struct {
			ChannelID string `json:"channel_id"`
		}
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "invalid body", 400)
			return
		}

		var (
			name        string
			description string
			isPrivate   bool
		)

		err = db.QueryRow(`
			SELECT name, description, is_private
			FROM channels
			WHERE id = $1
		`, req.ChannelID).Scan(&name, &description, &isPrivate)

		if err != nil {
			http.Error(w, "channel not found", 404)
			return
		}

		isFollowing := false
		if userID != "" {
			isFollowing, _ = utils.IsFollowing(db, userID, req.ChannelID)
		}

		json.NewEncoder(w).Encode(map[string]any{
			"id":           req.ChannelID,
			"name":         name,
			"description":  description,
			"is_private":   isPrivate,
			"is_following": isFollowing,
		})
	}
}

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
		userId, ok := r.Context().Value(auth.UserIDKey).(string)
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		channelID := uuid.NewString()

		_, err := db.Exec(`
		INSERT INTO channels (id, owner_id, name, description, is_private, created_at)
			VALUES ($1, $2, $3, $4, $5, NOW())
		`, channelID, userId, req.Name, req.Description, req.IsPrivate)
		print(userId, req.Name, req.Description, req.IsPrivate)
		if err != nil {
			log.Errorf("DB ERROR creating channel: %v", err)
			http.Error(w, "db error", 500)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"channel_id": channelID,
		})
	}
}
func SearchChannel(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Query string `json:"query"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid body", 400)
			return
		}
		rows, err := db.Query(`
			SELECT id, name, description, is_private FROM channels
			WHERE name ILIKE $1 OR description ILIKE $1
		`, "%"+req.Query+"%")
		if err != nil {
			log.Errorf("DB ERROR searching channels: %v", err)
			http.Error(w, "db error", 500)
			return
		}
		defer rows.Close()

		channels := []map[string]interface{}{}
		for rows.Next() {
			var id string
			var name string
			var description string
			var isPrivate bool

			err := rows.Scan(&id, &name, &description, &isPrivate)
			if err != nil {
				log.Errorf("DB ERROR scanning channel row: %v", err)
				continue
			}

			channels = append(channels, map[string]interface{}{
				"id":          id,
				"name":        name,
				"description": description,
				"is_private":  isPrivate,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(channels)
	}
}

func FollowChannelDB(db *sql.DB, userID, channelID string) error {
	_, err := db.Exec(`
		INSERT INTO channel_followers (user_id, channel_id, followed_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT DO NOTHING
	`, userID, channelID)
	return err
}

func UnFollowChannelDB(db *sql.DB, userID, channelID string) error {
	_, err := db.Exec(`
		DELETE FROM channel_followers
		WHERE user_id = $1 AND channel_id = $2
	`, userID, channelID)
	return err
}

func ToggleFollowChannel(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(auth.UserIDKey).(string)
		var req struct {
			ChannelID string `json:"channel_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid body", 400)
			return
		}
		isFollowing, err := utils.IsFollowing(db, userID, req.ChannelID)
		if err != nil {
			http.Error(w, "db error", 500)
			return
		}
		if isFollowing {
			err = UnFollowChannelDB(db, userID, req.ChannelID)
		} else {
			err = FollowChannelDB(db, userID, req.ChannelID)
		}

		if err != nil {
			http.Error(w, "db error", 500)
			return
		}
		json.NewEncoder(w).Encode(map[string]bool{
			"is_following": !isFollowing,
		})
	}
}
