package notification

import (
	"time"
)

type NotificationLog struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	EventID      string    `gorm:"type:varchar(20);not null;index" json:"event_id"`
	Channel      string    `gorm:"type:varchar(50);not null" json:"channel"`
	Recipient    string    `gorm:"type:varchar(255)" json:"recipient"`
	Status       string    `gorm:"type:varchar(20);not null" json:"status"`
	Message      string    `gorm:"type:text" json:"message"`
	ErrorMessage string    `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (NotificationLog) TableName() string {
	return "notification_logs"
}
