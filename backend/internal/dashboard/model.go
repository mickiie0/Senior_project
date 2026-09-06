package dashboard

import (
	"time"

	"github.com/google/uuid"
)

// --- Entities (ปรับปรุงตาม ER ล่าสุด) ---

type Camera struct {
	CameraID   uuid.UUID `gorm:"type:uuid;primaryKey;column:camera_id" json:"camera_id"`
	CameraName string    `gorm:"column:camera_name" json:"camera_name"`
	Location   string    `gorm:"column:location" json:"location"`
	IPAddress  string    `gorm:"column:ip_address" json:"ip_address"`
	Status     string    `gorm:"column:status" json:"status"`
	LastSeen   time.Time `gorm:"column:last_seen" json:"last_seen"`
	CreatedAt  time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Camera) TableName() string {
	return "camera"
}

type Image struct {
	ImageID     uuid.UUID `gorm:"type:uuid;primaryKey;column:image_id" json:"image_id"`
	CameraID    uuid.UUID `gorm:"type:uuid;column:camera_id" json:"camera_id"`
	EventID     uuid.UUID `gorm:"type:uuid;column:event_id" json:"event_id"`
	ImageType   string    `gorm:"column:image_type" json:"image_type"`
	ImagePath   string    `gorm:"column:image_path" json:"image_path"`
	CaptureTime time.Time `gorm:"column:capture_time" json:"capture_time"`
}

func (Image) TableName() string {
	return "image"
}

type DetectionEvent struct {
	EventID       uuid.UUID `gorm:"type:uuid;primaryKey;column:event_id" json:"event_id"`
	CameraID      uuid.UUID `gorm:"type:uuid;column:camera_id" json:"camera_id"`
	StartTime     time.Time `gorm:"column:start_time" json:"start_time"`
	DetectionType string    `gorm:"column:detection_type" json:"detection_type"`
	Confidence    float64   `gorm:"column:confidence" json:"confidence"`
	AlertSent     bool      `gorm:"column:alert_sent" json:"alert_sent"`

	// Relationships
	Camera Camera  `gorm:"foreignKey:CameraID;references:CameraID" json:"camera,omitempty"`
	Images []Image `gorm:"foreignKey:EventID;references:EventID" json:"images,omitempty"`
}

func (DetectionEvent) TableName() string {
	return "detection_event"
}

// --- DTOs สำหรับ Response & Query Filter ---

type DetectionResponse struct {
	EventID       uuid.UUID `json:"event_id"`
	CameraID      uuid.UUID `json:"camera_id"`
	CameraName    string    `json:"camera_name"`
	Location      string    `json:"location"`
	StartTime     time.Time `json:"start_time"`
	DetectionType string    `json:"detection_type"`
	Confidence    float64   `json:"confidence"`
	AlertSent     bool      `json:"alert_sent"`
	ImageURL      *string   `json:"image_url,omitempty"`
}

type DetectionFilter struct {
	Page          int    `form:"page,default=1"`
	Limit         int    `form:"limit,default=10"`
	DetectionType string `form:"detection_type"`
	CameraID      string `form:"camera_id"`
}

type DetectionListResponse struct {
	Data       []DetectionResponse `json:"data"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
	TotalPages int                 `json:"total_pages"`
}
