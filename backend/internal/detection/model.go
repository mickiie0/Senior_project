package detection

import "time"

type DetectionEvent struct {
	EventID       string    `gorm:"primaryKey;type:varchar(100)" json:"event_id"`
	CameraID      string    `gorm:"type:varchar(50);not null" json:"camera_id" binding:"required"`
	DetectionType string    `gorm:"type:varchar(50);not null" json:"detection_type" binding:"required"`
	Confidence    float64   `gorm:"not null" json:"confidence" binding:"required"`
	StartTime     time.Time `gorm:"not null" json:"start_time"`
	AlertSent     bool      `gorm:"default:false" json:"alert_sent"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// กำหนดชื่อ Table ใน Database
func (DetectionEvent) TableName() string {
	return "detection_events"
}
