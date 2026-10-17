package detection

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"fire_detection_web_app/internal/notification"
	"fire_detection_web_app/internal/sse"
)

type Service interface {
	ProcessEvent(input CreateEventInput) (*DetectionEvent, error)
	GetAllEvents() ([]DetectionEvent, error)
}

type service struct {
	repo    Repository
	hub     *sse.Hub
	discord notification.DiscordService
}

func NewService(repo Repository, hub *sse.Hub, discord notification.DiscordService) Service {
	return &service{
		repo:    repo,
		hub:     hub,
		discord: discord,
	}
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
		lower := strings.ToLower(d.DetectionType)
		isFire := strings.Contains(lower, "fire") && d.Confidence >= 0.60
		isSmoke := strings.Contains(lower, "smoke") && d.Confidence >= 0.40

		if isFire || isSmoke {
			details = append(details, EventDetail{
				DetectionType: d.DetectionType,
				Confidence:    d.Confidence,
				BoxCenterX:    d.BoxCenterX,
				BoxCenterY:    d.BoxCenterY,
				BoxWidth:      d.BoxWidth,
				BoxHeight:     d.BoxHeight,
			})
		}
	}

	if len(details) == 0 {
		return nil, nil
	}

	event := &DetectionEvent{
		CameraID: input.CameraID,
		Details:  details,
	}

	if err := s.repo.CreateEvent(event); err != nil {
		return nil, err
	}

	if input.ImageBase64 != "" {
		savedPath, err := saveBase64Image(input.ImageBase64, input.CameraID, event.CreatedAt)
		if err == nil {
			event.ImageURL = savedPath
			_ = s.repo.UpdateImageURL(event.EventID, savedPath)
		}
	}

	if s.hub != nil {
		s.hub.Broadcast("new_detection", event)
	}

	if s.discord != nil {
		hasAlert := false
		var topDetection EventDetail
		var detectionsSummary []notification.DetectionInfo
		for _, d := range details {
			lower := strings.ToLower(d.DetectionType)
			isFireAlert := strings.Contains(lower, "fire") && d.Confidence >= 0.60
			isSmokeAlert := strings.Contains(lower, "smoke") && d.Confidence >= 0.40

			if isFireAlert || isSmokeAlert {
				hasAlert = true
				if d.Confidence >= topDetection.Confidence {
					topDetection = d
				}
				detectionsSummary = append(detectionsSummary, notification.DetectionInfo{
					Type:       d.DetectionType,
					Confidence: d.Confidence,
				})
			}
		}

		if hasAlert {
			cam, _ := s.repo.GetCamera(event.CameraID)
			camLocation := ""
			camSubLocation := ""
			if cam != nil {
				camLocation = cam.Location
				camSubLocation = cam.SubLocation
			}

			s.discord.SendFireAlertAsync(notification.EventAlertData{
				EventID:       event.EventID,
				CameraID:      event.CameraID,
				CameraName:    event.CameraID,
				Location:      camLocation,
				SubLocation:   camSubLocation,
				DetectionType: topDetection.DetectionType,
				Confidence:    topDetection.Confidence,
				Detections:    detectionsSummary,
				ImageURL:      event.ImageURL,
				CreatedAt:     event.CreatedAt,
			})
		}
	}

	return event, nil
}

func (s *service) GetAllEvents() ([]DetectionEvent, error) {
	return s.repo.GetAllEvents()
}

func saveBase64Image(base64Data string, cameraID string, createdAt time.Time) (string, error) {
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
	dateDir := localTime.Format("2006-01-02")
	timeStr := localTime.Format("2006-01-02_15-04-05")

	dirPath := filepath.Join("./uploads", "detectionshot", dateDir, cameraID)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	filename := fmt.Sprintf("%s_%s.jpg", cameraID, timeStr)
	filePath := filepath.Join(dirPath, filename)

	if err := os.WriteFile(filePath, unbased, 0644); err != nil {
		return "", err
	}

	return fmt.Sprintf("/uploads/detectionshot/%s/%s/%s", dateDir, cameraID, filename), nil
}