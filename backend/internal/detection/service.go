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

	var details []EventDetail
	for _, d := range input.Detections {
		details = append(details, EventDetail{
			DetectionType: d.DetectionType,
			Confidence:    d.Confidence,
			BoxCenterX:    d.BoxCenterX,
			BoxCenterY:    d.BoxCenterY,
			BoxWidth:      d.BoxWidth,
			BoxHeight:     d.BoxHeight,
		})
	}

	event := &DetectionEvent{
		CameraID: input.CameraID,
		Details:  details,
	}

	if err := s.repo.CreateEvent(event); err != nil {
		return nil, err
	}

	if input.ImageBase64 != "" {
		savedPath, err := saveBase64Image(input.ImageBase64, event.EventID, event.CreatedAt)
		if err == nil {
			event.ImageURL = savedPath
			_ = s.repo.UpdateImageURL(event.EventID, savedPath)
		}
	}

	return event, nil
}

func (s *service) GetAllEvents() ([]DetectionEvent, error) {
	return s.repo.GetAllEvents()
}

func saveBase64Image(base64Data string, eventID string, createdAt time.Time) (string, error) {
	if idx := strings.Index(base64Data, ","); idx != -1 {
		base64Data = base64Data[idx+1:]
	}

	unbased, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", err
	}

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		loc = time.FixedZone("ICT", 7*3600)
	}

	localTime := createdAt.In(loc)
	timeStr := localTime.Format("2006-01-02_15-04-05")
	
	filename := fmt.Sprintf("%s_%s.jpg", eventID, timeStr)
	filePath := filepath.Join("./uploads", filename)

	if err := os.WriteFile(filePath, unbased, 0644); err != nil {
		return "", err
	}

	return "/uploads/" + filename, nil
}