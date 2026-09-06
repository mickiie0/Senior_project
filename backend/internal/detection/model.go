package detection

import (
	"time"

	"fire_detection_web_app/internal/camera"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DetectionEvent โครงสร้างตารางสำหรับเก็บประวัติการตรวจจับจากกล้อง
type DetectionEvent struct {
	EventID       string        `gorm:"type:uuid;primaryKey" json:"event_id"`
	CameraID      string        `gorm:"type:uuid;not null" json:"camera_id"`
	Camera        camera.Camera `gorm:"foreignKey:CameraID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"-"`
	DetectionType string        `gorm:"type:varchar(50);not null" json:"detection_type"`
	Confidence    float64       `gorm:"not null" json:"confidence"`
	CreatedAt     time.Time     `gorm:"autoCreateTime" json:"created_at"`
}

func (DetectionEvent) TableName() string {
	return "detection_events"
}

// BeforeCreate จะถูกเรียกใช้อัตโนมัติเพื่อสร้าง UUID ก่อน Insert ลงฐานข้อมูล
func (e *DetectionEvent) BeforeCreate(tx *gorm.DB) (err error) {
	if e.EventID == "" {
		e.EventID = uuid.New().String()
	}
	return
}

// CreateEventInput Struct สำหรับรับ Payload JSON จากกล้อง reCamera
type CreateEventInput struct {
	CameraID      string  `json:"camera_id" binding:"required,uuid"`
	DetectionType string  `json:"detection_type" binding:"required"`
	Confidence    float64 `json:"confidence" binding:"required"`
}