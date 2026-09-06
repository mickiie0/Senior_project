package dashboard

import (
	"context"

	"gorm.io/gorm"
)

type Repository interface {
	GetRecentDetections(ctx context.Context, limit int) ([]DetectionEvent, error)
	GetAllDetections(ctx context.Context, filter DetectionFilter) ([]DetectionEvent, int64, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetRecentDetections(ctx context.Context, limit int) ([]DetectionEvent, error) {
	if limit <= 0 {
		limit = 5
	}

	var events []DetectionEvent
	err := r.db.WithContext(ctx).
		Preload("Camera").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("capture_time DESC").Limit(1)
		}).
		Order("start_time DESC").
		Limit(limit).
		Find(&events).Error

	if err != nil {
		return nil, err
	}

	return events, nil
}

func (r *repository) GetAllDetections(ctx context.Context, filter DetectionFilter) ([]DetectionEvent, int64, error) {
	var events []DetectionEvent
	var total int64

	query := r.db.WithContext(ctx).Model(&DetectionEvent{})

	if filter.DetectionType != "" {
		query = query.Where("detection_type = ?", filter.DetectionType)
	}
	if filter.CameraID != "" {
		query = query.Where("camera_id = ?", filter.CameraID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit

	err := query.
		Preload("Camera").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("capture_time DESC").Limit(1)
		}).
		Order("start_time DESC").
		Limit(filter.Limit).
		Offset(offset).
		Find(&events).Error

	if err != nil {
		return nil, 0, err
	}

	return events, total, nil
}
