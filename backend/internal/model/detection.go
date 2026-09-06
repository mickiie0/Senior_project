package model

import (
	"time"

	"github.com/google/uuid"
)

type DetectionEvent struct {
	EventID       uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();column:event_id" json:"event_id"`
	CameraID      uuid.UUID `gorm:"type:uuid;not null;column:camera_id;index" json:"camera_id"`
	StartTime     time.Time `gorm:"type:timestamptz;not null;column:start_time;index" json:"start_time"`
	DetectionType string    `gorm:"type:varchar(50);not null;column:detection_type;index" json:"detection_type"`
	Confidence    float64   `gorm:"type:decimal(5,4);column:confidence" json:"confidence"`
	AlertSent     bool      `gorm:"type:boolean;default:false;column:alert_sent" json:"alert_sent"`

	Camera           *Camera           `gorm:"foreignKey:CameraID;references:CameraID" json:"camera,omitempty"`
	NotificationLogs []NotificationLog `gorm:"foreignKey:EventID;references:EventID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"notification_logs,omitempty"`
	Images           []Image           `gorm:"foreignKey:EventID;references:EventID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"images,omitempty"`
}

func (DetectionEvent) TableName() string {
	return "detection_event"
}

type Image struct {
	ImageID     uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();column:image_id" json:"image_id"`
	CameraID    uuid.UUID `gorm:"type:uuid;not null;column:camera_id;index" json:"camera_id"`
	EventID     uuid.UUID `gorm:"type:uuid;not null;column:event_id;index" json:"event_id"`
	ImageType   string    `gorm:"type:varchar(50);column:image_type" json:"image_type"`
	ImagePath   string    `gorm:"type:text;not null;column:image_path" json:"image_path"`
	CaptureTime time.Time `gorm:"type:timestamptz;not null;default:now();column:capture_time" json:"capture_time"`

	Camera         *Camera         `gorm:"foreignKey:CameraID;references:CameraID" json:"camera,omitempty"`
	DetectionEvent *DetectionEvent `gorm:"foreignKey:EventID;references:EventID" json:"detection_event,omitempty"`
}

func (Image) TableName() string {
	return "image"
}
