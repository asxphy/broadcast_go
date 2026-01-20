package utils

import (
	"database/sql"
)

func IsFollowing(db *sql.DB, userID, channelID string) (bool, error) {
	var exists bool
	err := db.QueryRow("Select Exists(select 1 from channel_followers where user_id=$1 and channel_id=$2)", userID, channelID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
