package detection

import (
	"fmt"
	"time"

	"fire_detection_web_app/internal/camera"

	"gorm.io/gorm"
)

type DetectionEvent struct {
	EventID   string        `gorm:"type:varchar(20);primaryKey" json:"event_id"`
	CameraID  string        `gorm:"type:varchar(20);not null" json:"camera_id"`
	Camera    camera.Camera `gorm:"foreignKey:CameraID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"-"`
	ImageURL  string        `gorm:"type:varchar(255)" json:"image_url"`
	CreatedAt time.Time     `gorm:"autoCreateTime" json:"created_at"`

	Details []EventDetail `gorm:"foreignKey:EventID;references:EventID" json:"details"`
}

func (DetectionEvent) TableName() string {
	return "detection_events"
}

func (e *DetectionEvent) BeforeCreate(tx *gorm.DB) (err error) {
	if e.EventID != "" {
		return nil
	}

	var lastEvent DetectionEvent
	err = tx.Unscoped().
		Where("event_id LIKE ?", "EVT-%").
		Order("event_id DESC").
		First(&lastEvent).Error

	nextSeq := 1

	if err == nil && len(lastEvent.EventID) > 4 {
		var currentSeq int
		fmt.Sscanf(lastEvent.EventID[4:], "%d", &currentSeq)
		nextSeq = currentSeq + 1
	}

	e.EventID = fmt.Sprintf("EVT-%06d", nextSeq)
	return nil
}

type EventDetail struct {
	ID            uint    `gorm:"primaryKey" json:"id"`
	EventID       string  `gorm:"type:varchar(20);not null;index" json:"event_id"`
	DetectionType string  `gorm:"type:varchar(50);not null" json:"detection_type"`
	Confidence    float64 `gorm:"not null" json:"confidence"`
	BoxCenterX    float64 `gorm:"type:decimal(10,4)" json:"box_center_x"`
	BoxCenterY    float64 `gorm:"type:decimal(10,4)" json:"box_center_y"`
	BoxWidth      float64 `gorm:"type:decimal(10,4)" json:"box_width"`
	BoxHeight     float64 `gorm:"type:decimal(10,4)" json:"box_height"`
}

func (EventDetail) TableName() string {
	return "event_details"
}

type BBoxInput struct {
	DetectionType string  `json:"detection_type" binding:"required"`
	Confidence    float64 `json:"confidence"`
	BoxCenterX    float64 `json:"box_center_x"`
	BoxCenterY    float64 `json:"box_center_y"`
	BoxWidth      float64 `json:"box_width"`
	BoxHeight     float64 `json:"box_height"`
}

type CreateEventInput struct {
	CameraID    string      `json:"camera_id" binding:"required"`
	ImageBase64 string      `json:"image_base64"`
	Detections  []BBoxInput `json:"detections" binding:"required"`
}