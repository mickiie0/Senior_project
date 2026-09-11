package camera

import (
	"log"
	"net"
	"time"

	"gorm.io/gorm"
)

func StartPingWorker(db *gorm.DB, interval time.Duration) {
	ticker := time.NewTicker(interval)

	go func() {
		for range ticker.C {
			checkAllCameras(db)
		}
	}()
}

func checkAllCameras(db *gorm.DB) {
	var cameras []Camera

	if err := db.Where("status != ?", "maintenance").Find(&cameras).Error; err != nil {
		log.Println("[Ping Worker] Error fetching cameras:", err)
		return
	}

	for _, cam := range cameras {
		if cam.IPAddress == "" {
			continue
		}

		go func(c Camera) {
			isAlive := PingReCamera(c.IPAddress, 2*time.Second)

			newStatus := "active"
			if !isAlive {
				newStatus = "inactive"
			}

			if c.Status != newStatus {
				err := db.Model(&Camera{}).Where("id = ?", c.ID).Update("status", newStatus).Error
				if err == nil {
					log.Printf("[Ping Worker] Camera %s (%s) status changed to %s\n", c.ID, c.IPAddress, newStatus)
				} else {
					log.Printf("[Ping Worker] Failed to update camera %s status: %v\n", c.ID, err)
				}
			}
		}(cam)
	}
}

func PingReCamera(ip string, timeout time.Duration) bool {
	ports := []string{
		"80",   // HTTP / Web Dashboard
		"554",  // RTSP Stream
		"22",   // SSH
		"8080", // Node-RED / Service
	}

	for _, port := range ports {
		address := net.JoinHostPort(ip, port)
		conn, err := net.DialTimeout("tcp", address, timeout)
		if err == nil {
			_ = conn.Close()
			return true
		}
	}

	return false
}