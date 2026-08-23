package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo *Repository
	jwt  *JWTService
}

func NewService(repo *Repository, jwt *JWTService) *Service {
	return &Service{
		repo: repo,
		jwt:  jwt,
	}
}

func (s *Service) Register(req RegisterRequest) error {
	hash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		return err
	}

	user := User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         "user", // สามารถรับมาจาก dynamic request ได้หากต้องการ
	}

	return s.repo.Create(&user)
}

func (s *Service) Login(req LoginRequest) (string, error) {
	user, err := s.repo.FindByEmail(req.Email)

	if err != nil {
		return "", errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	)

	if err != nil {
		return "", errors.New("invalid credentials")
	}

	token, err := s.jwt.GenerateToken(user)

	if err != nil {
		return "", err
	}

	return token, nil
}