package models

import "time"

type AudioEvent struct {
	ID        string
	SessionID string
	UserID    string
	EventType string
	CreatedAt time.Time
}
