package camera

import "gorm.io/gorm"

type Repository interface {
	Create(cam *Camera) error
	GetAll() ([]Camera, error)
	GetByID(id string) (*Camera, error)
	Update(cam *Camera) error
	Delete(id string) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(cam *Camera) error {
	return r.db.Create(cam).Error
}

func (r *repository) GetAll() ([]Camera, error) {
	var cameras []Camera
	err := r.db.Find(&cameras).Error
	return cameras, err
}

func (r *repository) GetByID(id string) (*Camera, error) {
	var cam Camera
	err := r.db.First(&cam, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &cam, nil
}

func (r *repository) Update(cam *Camera) error {
	return r.db.Save(cam).Error
}

func (r *repository) Delete(id string) error {
	return r.db.Delete(&Camera{}, "id = ?", id).Error
}