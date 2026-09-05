package camera

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Camera struct {
	ID          string    `gorm:"type:uuid;primary_key;" json:"camera_id"`
	SubLocation string    `gorm:"type:varchar(100);not null" json:"sub_location"`
	Location    string    `gorm:"type:varchar(100);not null" json:"location"`
	Status      string    `gorm:"type:varchar(20);default:'active'" json:"status"` // active, inactive, maintenance
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (c *Camera) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return
}

type CreateCameraInput struct {
	SubLocation string `json:"sub_location" binding:"required"`
	Location    string `json:"location" binding:"required"`
	Status      string `json:"status"`
}

type UpdateCameraInput struct {
	SubLocation string `json:"sub_location"`
	Location    string `json:"location"`
	Status      string `json:"status"`
}