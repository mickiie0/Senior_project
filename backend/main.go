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
	// การตั้งค่า viper สำหรับอ่าน config จาก .env
	viper.SetConfigFile(".env")
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Error reading config file (.env), falling back to system environment: %s", err)
	}
	viper.AutomaticEnv() // รองรับการอ่าน Environment Variable โดยตรงด้วย
}

var DB *gorm.DB

func ConnectDB() {
	dsn := viper.GetString("DATABASE_URL") // ดึง connection string จาก config
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

	// อ่านค่า JWT_SECRET ผ่าน viper แทน os.Getenv
	jwtSecret := viper.GetString("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatalf("JWT_SECRET is not set in environment or .env file")
	}

	r := gin.Default()

	// ตั้งค่า CORS ให้รองรับ Authorization Header จาก React
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	dbConn, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get database connection: %v", err)
	}

	// Initializing Services
	repo := auth.NewRepository(dbConn)
	jwtService := auth.NewJWT(jwtSecret, 24*time.Hour) // ส่งทั้ง Secret และ Expiration Time
	service := auth.NewService(repo, jwtService)
	handler := auth.NewHandler(service)

	// Public Endpoints
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
	}

	// Protected Endpoints
	api := r.Group("/api")
	api.Use(auth.AuthMiddleware(jwtSecret))
	{
		api.GET("/me", func(c *gin.Context) {
			// แก้ไข Key ให้ตรงกับ c.Set("user_id") ใน middleware.go
			userID, _ := c.Get("user_id")
			role, _ := c.Get("role")

			c.JSON(http.StatusOK, gin.H{
				"user_id": userID,
				"role":    role,
			})
		})
	}

	// Health check endpoint
	r.GET("/health", healthCheck)

	// เริ่มการทำงานของ API
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