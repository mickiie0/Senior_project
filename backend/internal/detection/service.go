package detection

import (
	"errors"
)

type Service interface {
	ProcessEvent(input CreateEventInput) (*DetectionEvent, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ProcessEvent(input CreateEventInput) (*DetectionEvent, error) {
	// 1. ตรวจสอบว่ามีกล้อง ID นี้ในระบบหรือไม่
	exists, err := s.repo.ExistsCamera(input.CameraID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("camera_id not found in system")
	}

	// 2. แปลง Input เป็น DetectionEvent Model
	event := &DetectionEvent{
		CameraID:      input.CameraID,
		DetectionType: input.DetectionType,
		Confidence:    input.Confidence,
	}

	// 3. บันทึกลง Database (BeforeCreate เจน EventID อัตโนมัติ)
	if err := s.repo.CreateEvent(event); err != nil {
		return nil, err
	}

	return event, nil
}