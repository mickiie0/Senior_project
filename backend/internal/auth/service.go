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
		Role:         "user",
	}

	return s.repo.Create(&user)
}

func (s *Service) Login(req LoginRequest) (string, error) {
	user, err := s.repo.FindByEmail(req.Email)

	if err != nil {
		return "", errors.New("invalid email")
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	)

	if err != nil {
		return "", errors.New("invalid password")
	}

	token, err := s.jwt.GenerateToken(user)

	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *Service) ChangePassword(userID, currentPassword, newPassword string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return errors.New("ไม่พบบัญชีผู้ใช้งาน")
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword))
	if err != nil {
		return errors.New("รหัสผ่านปัจจุบันไม่ถูกต้อง")
	}

	if len(newPassword) < 6 {
		return errors.New("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร")
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.UpdatePassword(userID, string(newHash))
}