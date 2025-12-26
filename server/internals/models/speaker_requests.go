package models

import "time"

type SpeakerRequest struct {
	ID          string
	SessionID   string
	UserID      string
	RequestedAt time.Time
	CreatedAt   time.Time
}
