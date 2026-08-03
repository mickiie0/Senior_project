package main

import (
	"fire_detection_web_app/internal/auth"

	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func init() {
	// การตั้งค่า viper สำหรับอ่าน config
	viper.SetConfigFile(".env")
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file, %s", err)
	}
}

var DB *gorm.DB

func ConnectDB() {
	dsn := viper.GetString("DATABASE_URL") // ดึง connection string จาก config
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	DB = db
	log.Println("Database connected successfully")
}

func main() {
	ConnectDB()
	// DB.AutoMigrate(&models.User{}) // สร้างตารางในฐานข้อมูลถ้ายังไม่มี

	r := gin.Default()
	r.Use(cors.Default())

	dbConn, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get database connection: %v", err)
	}

	repo := auth.NewRepository(dbConn)

	jwtService := auth.NewJWT(os.Getenv("JWT_SECRET"))

	service := auth.NewService(repo, jwtService)

	handler := auth.NewHandler(service)

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
	}

	api := r.Group("/api")

	api.Use(auth.AuthMiddleware(os.Getenv("JWT_SECRET")))

	api.GET("/me", func(c *gin.Context) {

		userID := c.GetString("user_id")

		c.JSON(200, gin.H{
			"user_id": userID,
		})

	})

	//endpoints
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
