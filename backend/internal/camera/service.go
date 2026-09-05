package camera

import (
	"errors"
	"time"
)

type Service interface {
	CreateCamera(input CreateCameraInput) (*Camera, error)
	GetAllCameras() ([]Camera, error)
	GetCameraByID(id string) (*Camera, error)
	UpdateCamera(id string, input UpdateCameraInput) (*Camera, error)
	DeleteCamera(id string) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateCamera(input CreateCameraInput) (*Camera, error) {
	status := input.Status

	// ถ้าผู้ใช้ไม่ได้เลือก status มาจากฟอร์ม ให้ทดสอบ Ping สัญญาณ IP ล่วงหน้าทันที 2 วินาที
	if status == "" {
		if input.IPAddress != "" && PingReCamera(input.IPAddress, 2*time.Second) {
			status = "active"
		} else {
			status = "inactive"
		}
	}

	cam := &Camera{
		IPAddress:   input.IPAddress,
		SubLocation: input.SubLocation,
		Location:    input.Location,
		Status:      status,
	}

	if err := s.repo.Create(cam); err != nil {
		return nil, err
	}

	return cam, nil
}

func (s *service) GetAllCameras() ([]Camera, error) {
	return s.repo.GetAll()
}

func (s *service) GetCameraByID(id string) (*Camera, error) {
	return s.repo.GetByID(id)
}

func (s *service) UpdateCamera(id string, input UpdateCameraInput) (*Camera, error) {
	cam, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("camera not found")
	}

	if input.IPAddress != "" {
		cam.IPAddress = input.IPAddress
	}
	if input.SubLocation != "" {
		cam.SubLocation = input.SubLocation
	}
	if input.Location != "" {
		cam.Location = input.Location
	}
	if input.Status != "" {
		cam.Status = input.Status
	}

	if err := s.repo.Update(cam); err != nil {
		return nil, err
	}

	return cam, nil
}

func (s *service) DeleteCamera(id string) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("camera not found")
	}
	return s.repo.Delete(id)
}