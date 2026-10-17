package snapshot

import (
	"fmt"
	"math/rand"
	"time"

	"fire_detection_web_app/internal/camera"

	"gorm.io/gorm"
)

type CameraSnapshot struct {
	ID         string        `gorm:"type:varchar(40);primaryKey" json:"id"`
	CameraID   string        `gorm:"type:varchar(20);not null;index" json:"camera_id"`
	Camera     camera.Camera `gorm:"foreignKey:CameraID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"camera,omitempty"`
	FilePath  string        `gorm:"type:varchar(255);not null" json:"file_path"`
	FileSize  int64         `json:"file_size"`
	CreatedAt time.Time     `gorm:"autoCreateTime;index" json:"created_at"`
}

func (CameraSnapshot) TableName() string {
	return "camera_snapshots"
}

func (s *CameraSnapshot) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID != "" {
		return nil
	}

	t := time.Now()
	randomSuffix := rand.Intn(9000) + 1000
	s.ID = fmt.Sprintf("SNP-%s-%04d", t.Format("20060102150405"), randomSuffix)
	return nil
}

type CreateSnapshotJSONInput struct {
	CameraID    string `json:"camera_id" binding:"required"`
	ImageBase64 string `json:"image_base64" binding:"required"`
}

type SnapshotQuery struct {
	CameraID string `form:"camera_id"`
	FromDate string `form:"from_date"`
	ToDate   string `form:"to_date"`
	Page     int    `form:"page,default=1"`
	Limit    int    `form:"limit,default=20"`
}

type SnapshotListResponse struct {
	TotalItems int64            `json:"total_items"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"total_pages"`
	Items      []CameraSnapshot `json:"items"`
}

type CameraCount struct {
	CameraID string `json:"camera_id"`
	Count    int64  `json:"count"`
}

type SnapshotStats struct {
	TotalSnapshots    int64         `json:"total_snapshots"`
	TotalStorageBytes int64         `json:"total_storage_bytes"`
	OldestSnapshot    *time.Time    `json:"oldest_snapshot"`
	ByCamera          []CameraCount `json:"by_camera"`
}
