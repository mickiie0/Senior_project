package snapshot

import (
	"time"

	"fire_detection_web_app/internal/camera"

	"gorm.io/gorm"
)

type Repository interface {
	Create(snapshot *CameraSnapshot) error
	ExistsCamera(cameraID string) (bool, error)
	List(query SnapshotQuery) ([]CameraSnapshot, int64, error)
	GetStats() (*SnapshotStats, error)
	GetOldSnapshots(cutoff time.Time, limit int) ([]CameraSnapshot, error)
	DeleteSnapshots(ids []string) error
	FindByID(id string) (*CameraSnapshot, error)
	DeleteByID(id string) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(snapshot *CameraSnapshot) error {
	return r.db.Create(snapshot).Error
}

func (r *repository) ExistsCamera(cameraID string) (bool, error) {
	var count int64
	err := r.db.Model(&camera.Camera{}).Where("id = ?", cameraID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *repository) List(query SnapshotQuery) ([]CameraSnapshot, int64, error) {
	db := r.db.Model(&CameraSnapshot{})

	if query.CameraID != "" {
		db = db.Where("camera_id = ?", query.CameraID)
	}

	if query.FromDate != "" {
		if t, err := time.Parse("2006-01-02", query.FromDate); err == nil {
			db = db.Where("captured_at >= ?", t)
		}
	}

	if query.ToDate != "" {
		if t, err := time.Parse("2006-01-02", query.ToDate); err == nil {
			endOfDay := t.Add(24*time.Hour - time.Nanosecond)
			db = db.Where("captured_at <= ?", endOfDay)
		}
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if query.Page <= 0 {
		query.Page = 1
	}
	if query.Limit <= 0 {
		query.Limit = 20
	} else if query.Limit > 100 {
		query.Limit = 100
	}

	offset := (query.Page - 1) * query.Limit

	var snapshots []CameraSnapshot
	err := db.Order("captured_at DESC").
		Limit(query.Limit).
		Offset(offset).
		Find(&snapshots).Error

	if err != nil {
		return nil, 0, err
	}

	return snapshots, total, nil
}

func (r *repository) GetStats() (*SnapshotStats, error) {
	var total int64
	if err := r.db.Model(&CameraSnapshot{}).Count(&total).Error; err != nil {
		return nil, err
	}

	var totalStorage int64
	row := r.db.Model(&CameraSnapshot{}).Select("COALESCE(SUM(file_size), 0)").Row()
	_ = row.Scan(&totalStorage)

	var oldest SnapshotStats
	var oldestTime time.Time
	err := r.db.Model(&CameraSnapshot{}).
		Order("captured_at ASC").
		Select("captured_at").
		Limit(1).
		Scan(&oldestTime).Error

	var oldestPtr *time.Time
	if err == nil && !oldestTime.IsZero() {
		oldestPtr = &oldestTime
	}

	var byCamera []CameraCount
	err = r.db.Model(&CameraSnapshot{}).
		Select("camera_id, COUNT(*) as count").
		Group("camera_id").
		Scan(&byCamera).Error
	if err != nil {
		return nil, err
	}

	oldest.TotalSnapshots = total
	oldest.TotalStorageBytes = totalStorage
	oldest.OldestSnapshot = oldestPtr
	oldest.ByCamera = byCamera

	return &oldest, nil
}

func (r *repository) GetOldSnapshots(cutoff time.Time, limit int) ([]CameraSnapshot, error) {
	var snapshots []CameraSnapshot
	err := r.db.Where("created_at < ?", cutoff).
		Order("created_at ASC").
		Limit(limit).
		Find(&snapshots).Error
	return snapshots, err
}

func (r *repository) DeleteSnapshots(ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return r.db.Where("id IN ?", ids).Delete(&CameraSnapshot{}).Error
}

func (r *repository) FindByID(id string) (*CameraSnapshot, error) {
	var snp CameraSnapshot
	if err := r.db.Where("id = ?", id).First(&snp).Error; err != nil {
		return nil, err
	}
	return &snp, nil
}

func (r *repository) DeleteByID(id string) error {
	return r.db.Where("id = ?", id).Delete(&CameraSnapshot{}).Error
}
