package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTService struct {
	Secret string
}

func NewJWT(secret string) *JWTService {

	return &JWTService{
		Secret: secret,
	}
}

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`

	jwt.RegisteredClaims
}

func (j *JWTService) GenerateToken(user *User) (string, error) {

	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,

		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(
				time.Now().Add(24 * time.Hour),
			),
		},
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	return token.SignedString([]byte(j.Secret))
}
