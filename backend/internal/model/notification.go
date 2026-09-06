package model

import (
	"time"

	"github.com/google/uuid"
)

type NotificationLog struct {
	NotificationID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();column:notification_id" json:"notification_id"`
	EventID        uuid.UUID `gorm:"type:uuid;not null;column:event_id;index" json:"event_id"`
	Platform       string    `gorm:"type:varchar(50);not null;column:platform" json:"platform"`
	Status         string    `gorm:"type:varchar(50);not null;column:status" json:"status"`
	SentTime       time.Time `gorm:"type:timestamptz;not null;default:now();column:sent_time" json:"sent_time"`
	Response       string    `gorm:"type:text;column:response" json:"response"`
}

func (NotificationLog) TableName() string {
	return "notification_log"
}
