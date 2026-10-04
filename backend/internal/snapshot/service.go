package snapshot

import (
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"math"
	"math/rand"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Service interface {
	SaveSnapshotMultipart(cameraID string, file *multipart.FileHeader, capturedAtStr string) (*CameraSnapshot, error)
	SaveSnapshotBase64(cameraID string, base64Data string, capturedAtStr string) (*CameraSnapshot, error)
	ListSnapshots(query SnapshotQuery) (*SnapshotListResponse, error)
	GetStats() (*SnapshotStats, error)
	DeleteSnapshot(id string) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) parseCapturedAt(capturedAtStr string) time.Time {
	if capturedAtStr != "" {
		if t, err := time.Parse(time.RFC3339, capturedAtStr); err == nil {
			return t
		}
		if t, err := time.Parse("2006-01-02 15:04:05", capturedAtStr); err == nil {
			return t
		}
	}
	return time.Now()
}

func (s *service) generateFilePath(cameraID string, capturedAt time.Time) (string, string, error) {
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		loc = time.FixedZone("ICT", 7*3600)
	}

	localTime := capturedAt.In(loc)
	dateDir := localTime.Format("2006-01-02")
	timeStr := localTime.Format("20060102_150405")
	randomSuffix := rand.Intn(900) + 100

	dirPath := filepath.Join("./uploads", "snapshot", dateDir, cameraID)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return "", "", fmt.Errorf("failed to create directory: %w", err)
	}

	filename := fmt.Sprintf("%s_%s_%03d.jpg", cameraID, timeStr, randomSuffix)
	diskPath := filepath.Join(dirPath, filename)
	urlPath := fmt.Sprintf("/uploads/snapshot/%s/%s/%s", dateDir, cameraID, filename)

	return diskPath, urlPath, nil
}

func (s *service) SaveSnapshotMultipart(cameraID string, fileHeader *multipart.FileHeader, capturedAtStr string) (*CameraSnapshot, error) {
	exists, err := s.repo.ExistsCamera(cameraID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("camera_id not found in system")
	}

	capturedAt := s.parseCapturedAt(capturedAtStr)
	diskPath, urlPath, err := s.generateFilePath(cameraID, capturedAt)
	if err != nil {
		return nil, err
	}

	src, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(diskPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file on disk: %w", err)
	}
	defer dst.Close()

	size, err := io.Copy(dst, src)
	if err != nil {
		_ = os.Remove(diskPath)
		return nil, fmt.Errorf("failed to write file content: %w", err)
	}

	snapshot := &CameraSnapshot{
		CameraID:   cameraID,
		FilePath:   urlPath, // relative URL path served by Gin
		FileSize:   size,
		CapturedAt: capturedAt,
	}

	if err := s.repo.Create(snapshot); err != nil {
		_ = os.Remove(diskPath)
		return nil, err
	}

	return snapshot, nil
}

func (s *service) SaveSnapshotBase64(cameraID string, base64Data string, capturedAtStr string) (*CameraSnapshot, error) {
	exists, err := s.repo.ExistsCamera(cameraID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("camera_id not found in system")
	}

	if idx := strings.Index(base64Data, ","); idx != -1 {
		base64Data = base64Data[idx+1:]
	}

	decodedBytes, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return nil, errors.New("invalid base64 image data")
	}

	capturedAt := s.parseCapturedAt(capturedAtStr)
	diskPath, urlPath, err := s.generateFilePath(cameraID, capturedAt)
	if err != nil {
		return nil, err
	}

	if err := os.WriteFile(diskPath, decodedBytes, 0644); err != nil {
		return nil, fmt.Errorf("failed to write file to disk: %w", err)
	}

	snapshot := &CameraSnapshot{
		CameraID:   cameraID,
		FilePath:   urlPath,
		FileSize:   int64(len(decodedBytes)),
		CapturedAt: capturedAt,
	}

	if err := s.repo.Create(snapshot); err != nil {
		_ = os.Remove(diskPath)
		return nil, err
	}

	return snapshot, nil
}

func (s *service) ListSnapshots(query SnapshotQuery) (*SnapshotListResponse, error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.Limit <= 0 {
		query.Limit = 20
	}

	items, total, err := s.repo.List(query)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(query.Limit)))
	if totalPages == 0 && total > 0 {
		totalPages = 1
	}

	return &SnapshotListResponse{
		TotalItems: total,
		Page:       query.Page,
		Limit:      query.Limit,
		TotalPages: totalPages,
		Items:      items,
	}, nil
}

func (s *service) GetStats() (*SnapshotStats, error) {
	return s.repo.GetStats()
}

func (s *service) DeleteSnapshot(id string) error {
	snp, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	// Remove physical file from disk
	relPath := strings.TrimPrefix(snp.FilePath, "/")
	if strings.HasPrefix(relPath, "uploads/snapshot") || strings.HasPrefix(relPath, "uploads\\snapshot") {
		_ = os.Remove(relPath)
	}

	return s.repo.DeleteByID(id)
}
