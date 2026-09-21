package notification

import (
	"gorm.io/gorm"
)

type Repository interface {
	CreateLog(log *NotificationLog) error
	GetLogs(limit int) ([]NotificationLog, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateLog(log *NotificationLog) error {
	return r.db.Create(log).Error
}

func (r *repository) GetLogs(limit int) ([]NotificationLog, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var logs []NotificationLog
	err := r.db.Order("created_at DESC").Limit(limit).Find(&logs).Error
	return logs, err
}
