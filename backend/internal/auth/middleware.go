package auth

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
)

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := ""
		if header := c.GetHeader("Authorization"); header != "" {
			tokenString = strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		} else if queryToken := c.Query("token"); queryToken != "" {
			tokenString = strings.TrimSpace(queryToken)
		}

		if tokenString == "" {
			c.AbortWithStatusJSON(401, gin.H{
				"error": "missing token",
			})
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(
			tokenString,
			claims,
			func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(secret), nil
			},
		)

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(401, gin.H{
				"error": "invalid token",
			})
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
			return
		}

		for _, role := range roles {
			if roleStr == role {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(403, gin.H{"error": "forbidden: insufficient permissions"})
	}
}

func CameraMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		expectedKey := viper.GetString("CAMERA_API_KEY")
		if expectedKey == "" {
			c.AbortWithStatusJSON(500, gin.H{
				"error": "server configuration error: CAMERA_API_KEY is not set",
			})
			return
		}

		clientKey := c.GetHeader("X-API-Key")
		if clientKey == "" {
			c.AbortWithStatusJSON(401, gin.H{
				"error": "missing X-API-Key header",
			})
			return
		}

		if clientKey != expectedKey {
			c.AbortWithStatusJSON(401, gin.H{
				"error": "invalid API key",
			})
			return
		}

		c.Next()
	}
}