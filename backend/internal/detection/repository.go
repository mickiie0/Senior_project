package detection

import (
	"fire_detection_web_app/internal/camera"

	"gorm.io/gorm"
)

type Repository interface {
	ExistsCamera(cameraID string) (bool, error)
	CreateEvent(event *DetectionEvent) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

// ExistsCamera ตรวจสอบว่า camera_id มีอยู่ในตาราง cameras หรือไม่
func (r *repository) ExistsCamera(cameraID string) (bool, error) {
	var count int64
	err := r.db.Model(&camera.Camera{}).Where("id = ?", cameraID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *repository) CreateEvent(e *DetectionEvent) error {
	return r.db.Create(e).Error
}