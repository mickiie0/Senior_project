package main

import (
	"fire_detection_web_app/internal/auth"
	"fire_detection_web_app/internal/camera"
	"fire_detection_web_app/internal/detection"
	"fire_detection_web_app/internal/notification"
	"fire_detection_web_app/internal/sse"

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

	if err := DB.AutoMigrate(&auth.User{}, &camera.Camera{}, &detection.DetectionEvent{}, &detection.EventDetail{}, &notification.NotificationLog{}); err != nil {
		log.Fatalf("Failed to auto migrate database tables: %v", err)
	}

	addFKSQL := `
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.table_constraints
				WHERE constraint_name = 'fk_notif_event'
				  AND table_name = 'notification_logs'
			) THEN
				ALTER TABLE notification_logs
					ADD CONSTRAINT fk_notif_event
					FOREIGN KEY (event_id)
					REFERENCES detection_events(event_id)
					ON UPDATE CASCADE ON DELETE RESTRICT;
			END IF;
		END $$;
	`
	if err := DB.Exec(addFKSQL).Error; err != nil {
		log.Fatalf("Failed to add FK constraint fk_notif_event: %v", err)
	}
	log.Println("FK constraint fk_notif_event ensured on notification_logs.event_id")


	log.Println("Starting Camera Ping Worker...")
	camera.StartPingWorker(DB, 1*time.Minute)

	jwtSecret := viper.GetString("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatalf("JWT_SECRET is not set in environment or .env file")
	}

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-API-Key"}
	r.Use(cors.New(config))

	r.Static("/uploads", "./uploads")

	// Auth Module
	repo := auth.NewRepository(DB)
	jwtService := auth.NewJWT(jwtSecret, 24*time.Hour)
	service := auth.NewService(repo, jwtService)
	handler := auth.NewHandler(service)

	// Camera Module
	camRepo := camera.NewRepository(DB)
	camService := camera.NewService(camRepo)
	camHandler := camera.NewHandler(camService)

	// Notification & Discord Module
	discordWebhookURL := viper.GetString("DISCORD_WEBHOOK_URL")
	if discordWebhookURL == "" {
		log.Fatalf("DISCORD_WEBHOOK_URL is not set in environment or .env file")
	}
	notifRepo := notification.NewRepository(DB)
	discordService := notification.NewDiscordService(discordWebhookURL, notifRepo)
	notifHandler := notification.NewHandler(notifRepo)

	// SSE Real-time Hub
	sseHub := sse.NewHub()

	// Detection Module
	detectionRepo := detection.NewRepository(DB)
	detectionService := detection.NewService(detectionRepo, sseHub, discordService)
	detectionHandler := detection.NewHandler(detectionService, sseHub)

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
	}

	cameraApi := r.Group("/api")
	cameraApi.Use(auth.CameraMiddleware())
	{
		cameraApi.POST("/detections", detectionHandler.ReceiveEvent)
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
		api.PATCH("/me/change-password", handler.ChangePassword)

		api.GET("/detections", detectionHandler.GetAll)
		api.GET("/events/stream", detectionHandler.StreamEvents)
		api.GET("/cameras", camHandler.GetAll)
		api.GET("/cameras/:id", camHandler.GetByID)
		api.GET("/notifications/logs", notifHandler.GetLogs)

		adminCameras := api.Group("/cameras")
		adminCameras.Use(auth.RequireRole("admin"))
		{
			adminCameras.POST("/test-ip", camHandler.TestConnection)
			adminCameras.POST("", camHandler.Create)
			adminCameras.PUT("/:id", camHandler.Update)
			adminCameras.DELETE("/:id", camHandler.Delete)
		}
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