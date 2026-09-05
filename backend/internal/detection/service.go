package detection

type Service interface {
	ProcessEvent(event *DetectionEvent) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ProcessEvent(e *DetectionEvent) error {
	return s.repo.CreateEvent(e)
}