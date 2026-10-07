package snapshot

import (
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"
)

func StartCleanupWorker(db *gorm.DB, interval time.Duration) {
	go func() {
		time.Sleep(30 * time.Second)
		runPruneCycle(db)

		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			runPruneCycle(db)
		}
	}()
}

func runPruneCycle(db *gorm.DB) {
	log.Println("[Snapshot Cleanup] Running retention check (90 days policy)...")

	cutoffDate := time.Now().AddDate(0, 0, -90)
	batchSize := 200
	totalDeleted := 0

	for {
		var oldSnapshots []CameraSnapshot
		err := db.Where("created_at < ?", cutoffDate).
			Order("created_at ASC").
			Limit(batchSize).
			Find(&oldSnapshots).Error

		if err != nil {
			log.Printf("[Snapshot Cleanup] Error querying expired snapshots: %v\n", err)
			break
		}

		if len(oldSnapshots) == 0 {
			break
		}

		var idsToDelete []string
		for _, snp := range oldSnapshots {
			cleanPath := filepath.ToSlash(snp.FilePath)
			cleanPath = strings.TrimPrefix(cleanPath, "/")

			if !strings.HasPrefix(cleanPath, "uploads/snapshot") {
				log.Printf("[Snapshot Cleanup] SAFETY WARNING: Skipped file outside snapshot directory: %s (ID: %s)\n", snp.FilePath, snp.ID)
				continue
			}

			if err := os.Remove(cleanPath); err != nil && !os.IsNotExist(err) {
				log.Printf("[Snapshot Cleanup] Notice: Could not remove file %s: %v\n", cleanPath, err)
			}

			idsToDelete = append(idsToDelete, snp.ID)
		}

		if len(idsToDelete) > 0 {
			if err := db.Where("id IN ?", idsToDelete).Delete(&CameraSnapshot{}).Error; err != nil {
				log.Printf("[Snapshot Cleanup] Error deleting snapshot records from DB: %v\n", err)
				break
			}
			totalDeleted += len(idsToDelete)
		}

		if len(oldSnapshots) < batchSize {
			break
		}
	}

	if totalDeleted > 0 {
		log.Printf("[Snapshot Cleanup] Finished pruning: removed %d expired snapshots (>90 days).\n", totalDeleted)
	} else {
		log.Println("[Snapshot Cleanup] Finished pruning: 0 expired snapshots found.")
	}
}
