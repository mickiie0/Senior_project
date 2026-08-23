package main

import (
	"fire_detection_web_app/internal/auth"

	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func init() {
	viper.SetConfigFile(".env")
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Error reading config file (.env), falling back to system environment: %s", err)
	}
	viper.AutomaticEnv()
}

var DB *gorm.DB

func ConnectDB() {
	dsn := viper.GetString("DATABASE_URL")
	if dsn == "" {
		log.Fatalf("DATABASE_URL is not set")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	DB = db
	log.Println("Database connected successfully")
}

func main() {
	ConnectDB()

	jwtSecret := viper.GetString("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatalf("JWT_SECRET is not set in environment or .env file")
	}

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	dbConn, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get database connection: %v", err)
	}

	repo := auth.NewRepository(dbConn)
	jwtService := auth.NewJWT(jwtSecret, 24*time.Hour)
	service := auth.NewService(repo, jwtService)
	handler := auth.NewHandler(service)

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
	}

	api := r.Group("/api")
	api.Use(auth.AuthMiddleware(jwtSecret))
	{
		api.GET("/me", func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			username, _ := c.Get("username")
			email, _ := c.Get("email")
			role, _ := c.Get("role")

			c.JSON(http.StatusOK, gin.H{
				"user_id":  userID,
				"username": username,
				"email":    email,
				"role":     role,
			})
		})
	}

	r.GET("/health", healthCheck)

	port := viper.GetString("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func healthCheck(c *gin.Context) {
	db, err := DB.DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "Database connection failed",
			"error":  err.Error(),
		})
		return
	}

	if err := db.Ping(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "Database unreachable",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "Healthy",
		"database": "Connected",
	})
}