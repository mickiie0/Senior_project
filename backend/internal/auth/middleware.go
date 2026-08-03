package auth

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(secret string) gin.HandlerFunc {

	return func(c *gin.Context) {

		header := c.GetHeader("Authorization")

		if header == "" {

			c.AbortWithStatusJSON(401, gin.H{
				"error": "missing token",
			})

			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")

		token, err := jwt.ParseWithClaims(
			tokenString,
			&Claims{},
			func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			},
		)

		if err != nil {

			c.AbortWithStatusJSON(401, gin.H{
				"error": "invalid token",
			})

			return
		}

		claims := token.Claims.(*Claims)

		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)

		c.Next()

	}
}
