package models

import "time"

type LiveSession struct {
	Id        string
	ChannelID string
	Status    string
	StartedAt time.Time
	EndedAt   time.Time
}
