package models

import "time"

type Channel struct {
	ID          string
	OwnerID     string
	Name        string
	Description string
	IsPrivate   bool
	CreatedAt   time.Time
}
