package handlers

import (
	"database/sql"
	"encoding/json"
	"my-app/server/internals/auth"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
)

func HomeFeed(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(auth.UserIDKey).(string)
		println(userID)
		rows, err := db.Query(`
			SELECT c.id, c.name, c.description
			FROM channels c
			JOIN channel_followers cf ON c.id = cf.channel_id
			WHERE cf.user_id = $1
			ORDER BY cf.followed_at DESC
		`, userID)

		if err != nil {
			http.Error(w, "db error", 500)
		}

		defer rows.Close()

		var channels []map[string]string

		for rows.Next() {
			var id, name, desc string
			rows.Scan(&id, &name, &desc)
			channels = append(channels, map[string]string{
				"id":          id,
				"name":        name,
				"description": desc,
			})
		}
		json.NewEncoder(w).Encode(channels)
	}
}

func StartLiveSession(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("user_id").(string)

		channelID := chi.URLParam(r, "id")

		var owner string
		err := db.QueryRow(` Select owner_id from channels where id = $1`, channelID).Scan(&owner)
		if err != nil || owner != userID {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		sessionID := uuid.NewString()

		_, err = db.Exec(`
			INSERT INTO live_sessions (id, channel_id, status, started_at)
			VALUES ($1, $2, 'live', NOW())
		`, sessionID, channelID)

		if err != nil {
			http.Error(w, "db error", 500)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"session_id": sessionID,
		})
	}
}

func JoinSession(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("user_id").(string)
		sessionID := chi.URLParam(r, "id")

		_, err := db.Exec(`
			INSERT INTO session_participants (session_id, user_id, role, joined_at)
			VALUES ($1, $2, 'listener', NOW())
			ON CONFLICT DO NOTHING
		`, sessionID, userID)

		if err != nil {
			http.Error(w, "db error", 500)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func RequestSpeaker(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("user_id").(string)
		sessionID := chi.URLParam(r, "id")

		_, err := db.Exec(`
			INSERT INTO speaker_requests (id, session_id, user_id, status, created_at)
			VALUES ($1, $2, $3, 'pending', NOW())
		`, uuid.NewString(), sessionID, userID)

		if err != nil {
			http.Error(w, "db error", 500)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func ApproveSpeaker(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionID := chi.URLParam(r, "id")
		targetUser := chi.URLParam(r, "userId")

		_, err := db.Exec(`
			UPDATE session_participants
			SET role = 'speaker'
			WHERE session_id = $1 AND user_id = $2
		`, sessionID, targetUser)

		if err != nil {
			http.Error(w, "db error", 500)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
