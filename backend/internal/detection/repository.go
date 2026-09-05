package detection

import "gorm.io/gorm"

type Repository interface {
	CreateEvent(event *DetectionEvent) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateEvent(e *DetectionEvent) error {
	// GORM จะทำ INSERT INTO ให้แค่นี้เลยครับ
	return r.db.Create(e).Error
}