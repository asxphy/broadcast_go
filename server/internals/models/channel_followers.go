package models

import "time"

type ChannelFollower struct {
	UserID     string
	ChannelID  string
	FollowedAt time.Time
}
