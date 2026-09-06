package model

import (
	"time"

	"github.com/google/uuid"
)

type Camera struct {
	CameraID   uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();column:camera_id" json:"camera_id"`
	CameraName string    `gorm:"type:varchar(150);not null;column:camera_name" json:"camera_name"`
	Location   string    `gorm:"type:text;column:location" json:"location"`
	IPAddress  string    `gorm:"type:varchar(50);column:ip_address" json:"ip_address"`
	Status     string    `gorm:"type:varchar(50);not null;default:'offline';column:status" json:"status"`
	LastSeen   time.Time `gorm:"type:timestamptz;column:last_seen" json:"last_seen"`
	CreatedAt  time.Time `gorm:"type:timestamptz;not null;default:now();column:created_at" json:"created_at"`

	StatusLogs      []CameraStatusLog `gorm:"foreignKey:CameraID;references:CameraID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"status_logs,omitempty"`
	DetectionEvents []DetectionEvent  `gorm:"foreignKey:CameraID;references:CameraID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"detection_events,omitempty"`
	Images          []Image           `gorm:"foreignKey:CameraID;references:CameraID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"images,omitempty"`
}

func (Camera) TableName() string {
	return "camera"
}

type CameraStatusLog struct {
	StatusLogID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();column:status_log_id" json:"status_log_id"`
	CameraID    uuid.UUID `gorm:"type:uuid;not null;column:camera_id;index" json:"camera_id"`
	Status      string    `gorm:"type:varchar(50);not null;column:status" json:"status"`
	LogTime     time.Time `gorm:"type:timestamptz;not null;default:now();column:log_time" json:"log_time"`
}

func (CameraStatusLog) TableName() string {
	return "camera_status_log"
}
