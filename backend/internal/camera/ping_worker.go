package camera

import (
	"log"
	"net"
	"time"

	"gorm.io/gorm"
)

// StartPingWorker เริ่มต้นรัน Background Worker สำหรับตรวจเช็กสถานะกล้อง
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

	// ดึงข้อมูลกล้องทั้งหมดที่ไม่ใช่สถานะส่งซ่อม (maintenance)
	if err := db.Where("status != ?", "maintenance").Find(&cameras).Error; err != nil {
		log.Println("[Ping Worker] Error fetching cameras:", err)
		return
	}

	for _, cam := range cameras {
		if cam.IPAddress == "" {
			continue
		}

		// รัน Goroutine ตรวจสอบกล้องแต่ละตัวพร้อมกันแบบขนาน
		go func(c Camera) {
			isAlive := PingReCamera(c.IPAddress, 2*time.Second)

			newStatus := "active"
			if !isAlive {
				newStatus = "inactive"
			}

			// อัปเดตลง Database เฉพาะกรณีที่สถานะเปลี่ยนแปลงจากเดิม
			if c.Status != newStatus {
				err := db.Model(&Camera{}).Where("id = ?", c.ID).Update("status", newStatus).Error
				if err == nil {
					log.Printf("[Ping Worker] Camera %s (%s) status changed to %s\n", c.ID, c.IPAddress, newStatus)
				}
			}
		}(cam)
	}
}

// PingReCamera เปลี่ยนเป็น Public Function (ตัว P พิมพ์ใหญ่) เพื่อให้ service และ handler เรียกใช้ได้
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
			return true // เชื่อมต่อได้ แสดงว่ากล้องทำงานอยู่
		}
	}

	return false // เชื่อมต่อไม่ได้เลย แสดงว่ากล้องดับหรือหลุด
}