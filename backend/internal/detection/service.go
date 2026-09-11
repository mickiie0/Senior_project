package detection

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Service interface {
	ProcessEvent(input CreateEventInput) (*DetectionEvent, error)
	GetAllEvents() ([]DetectionEvent, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ProcessEvent(input CreateEventInput) (*DetectionEvent, error) {
	exists, err := s.repo.ExistsCamera(input.CameraID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("camera_id not found in system")
	}

	// 1. แปลงภาพ Base64 เซฟลงโฟลเดอร์ ./uploads
	var imageURL string
	if input.ImageBase64 != "" {
		savedPath, err := saveBase64Image(input.ImageBase64)
		if err == nil {
			imageURL = savedPath
		}
	}

	var details []EventDetail
	for _, d := range input.Detections {
		details = append(details, EventDetail{
			DetectionType: d.DetectionType,
			Confidence:    d.Confidence,
			XMin:          d.XMin,
			YMin:          d.YMin,
			XMax:          d.XMax,
			YMax:          d.YMax,
		})
	}

	event := &DetectionEvent{
		CameraID: input.CameraID,
		ImageURL: imageURL,
		Details:  details,
	}

	if err := s.repo.CreateEvent(event); err != nil {
		return nil, err
	}

	return event, nil
}

func (s *service) GetAllEvents() ([]DetectionEvent, error) {
	return s.repo.GetAllEvents()
}

func saveBase64Image(base64Data string) (string, error) {
	if idx := strings.Index(base64Data, ","); idx != -1 {
		base64Data = base64Data[idx+1:]
	}

	unbased, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", err
	}

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("evt_%d.jpg", time.Now().UnixNano())
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, unbased, 0644); err != nil {
		return "", err
	}

	return "/uploads/" + filename, nil
}