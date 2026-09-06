package dashboard

import (
	"context"
	"math"
)

type Service interface {
	GetRecentDetections(ctx context.Context, limit int) ([]DetectionResponse, error)
	GetAllDetections(ctx context.Context, filter DetectionFilter) (*DetectionListResponse, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetRecentDetections(ctx context.Context, limit int) ([]DetectionResponse, error) {
	if limit <= 0 {
		limit = 5
	}

	events, err := s.repo.GetRecentDetections(ctx, limit)
	if err != nil {
		return nil, err
	}

	return s.toDTOList(events), nil
}

func (s *service) GetAllDetections(ctx context.Context, filter DetectionFilter) (*DetectionListResponse, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}

	events, total, err := s.repo.GetAllDetections(ctx, filter)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))

	return &DetectionListResponse{
		Data:       s.toDTOList(events),
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *service) toDTOList(events []DetectionEvent) []DetectionResponse {
	results := make([]DetectionResponse, 0, len(events))
	for _, e := range events {
		resp := DetectionResponse{
			EventID:       e.EventID,
			CameraID:      e.CameraID,
			CameraName:    e.Camera.CameraName,
			Location:      e.Camera.Location,
			StartTime:     e.StartTime,
			DetectionType: e.DetectionType,
			Confidence:    e.Confidence,
			AlertSent:     e.AlertSent,
		}

		if len(e.Images) > 0 {
			imgURL := e.Images[0].ImagePath
			resp.ImageURL = &imgURL
		}

		results = append(results, resp)
	}
	return results
}
