package models

import "time"

type SessionParticipant struct {
	SessionID string
	UserID    string
	Rolee     string
	JoinedAt  time.Time
	LeftAt    time.Time
}
