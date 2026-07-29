package main

import (
	"log"
	"net/http"

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

	//endpoints
	r.GET("/health", healthCheck)
	// r.GET("/cate/:cate_id", getItemBycate)
	// r.GET("/shop/:shop_id", getShopDes)
	// r.GET("/allshop", allShop)
	// r.GET("/item/:product_id", getProductInfo)
	// r.GET("/itembyshop/:shop_id", getProductByShop)
	// r.GET("/shopinfo/:item_id", getShopInfoByItem)
	// r.GET("/readom", getRandomProduct)

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
