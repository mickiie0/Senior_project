package detection

import (
	"fire_detection_web_app/internal/camera"

	"gorm.io/gorm"
)

type Repository interface {
	ExistsCamera(cameraID string) (bool, error)
	GetCamera(cameraID string) (*camera.Camera, error)
	CreateEvent(event *DetectionEvent) error
	GetAllEvents() ([]DetectionEvent, error)
	UpdateImageURL(eventID string, imageURL string) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) ExistsCamera(cameraID string) (bool, error) {
	var count int64
	err := r.db.Model(&camera.Camera{}).Where("id = ?", cameraID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *repository) GetCamera(cameraID string) (*camera.Camera, error) {
	var cam camera.Camera
	err := r.db.Where("id = ?", cameraID).First(&cam).Error
	if err != nil {
		return nil, err
	}
	return &cam, nil
}

func (r *repository) CreateEvent(e *DetectionEvent) error {
	return r.db.Create(e).Error
}

func (r *repository) GetAllEvents() ([]DetectionEvent, error) {
	var events []DetectionEvent
	err := r.db.Preload("Details").Order("created_at DESC").Find(&events).Error
	return events, err
}

func (r *repository) UpdateImageURL(eventID string, imageURL string) error {
	return r.db.Model(&DetectionEvent{}).Where("event_id = ?", eventID).Update("image_url", imageURL).Error
}