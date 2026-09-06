package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	UserID       uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();column:user_id" json:"user_id"`
	Username     string    `gorm:"type:varchar(100);not null;unique;column:username" json:"username"`
	Email        string    `gorm:"type:varchar(255);not null;unique;column:email" json:"email"`
	PasswordHash string    `gorm:"type:text;not null;column:password_hash" json:"-"`
	Role         string    `gorm:"type:varchar(50);not null;default:'user';column:role" json:"role"`
	CreatedAt    time.Time `gorm:"type:timestamptz;not null;default:now();column:created_at" json:"created_at"`
}

func (User) TableName() string {
	return "user"
}
