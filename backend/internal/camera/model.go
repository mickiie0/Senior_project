package camera

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type Camera struct {
	ID          string    `gorm:"type:varchar(20);primaryKey" json:"camera_id"`
	IPAddress   string    `gorm:"type:varchar(45);not null" json:"ip_address"`
	Location    string    `gorm:"type:varchar(100);not null" json:"location"`
	SubLocation string    `gorm:"type:varchar(100);not null" json:"sub_location"`
	Status      string    `gorm:"type:varchar(20);not null;default:'unknown'" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Camera) TableName() string {
	return "cameras"
}

func (c *Camera) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID != "" {
		return nil
	}

	var lastCamera Camera
	err = tx.Unscoped().
		Where("id LIKE ?", "CAM-%").
		Order("id DESC").
		First(&lastCamera).Error

	nextSeq := 1

	if err == nil && len(lastCamera.ID) > 4 {
		var currentSeq int
		fmt.Sscanf(lastCamera.ID[4:], "%d", &currentSeq)
		nextSeq = currentSeq + 1
	}

	c.ID = fmt.Sprintf("CAM-%03d", nextSeq)
	return nil
}

type CreateCameraInput struct {
	IPAddress   string `json:"ip_address" binding:"required,ip"`
	SubLocation string `json:"sub_location" binding:"required"`
	Location    string `json:"location" binding:"required"`
}

type UpdateCameraInput struct {
	IPAddress   string `json:"ip_address" binding:"omitempty,ip"`
	SubLocation string `json:"sub_location"`
	Location    string `json:"location"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive"`
}