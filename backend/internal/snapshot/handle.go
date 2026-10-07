package snapshot

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) UploadSnapshot(c *gin.Context) {
	contentType := c.GetHeader("Content-Type")

	if strings.Contains(contentType, "multipart/form-data") {
		cameraID := c.PostForm("camera_id")
		if cameraID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "camera_id is required"})
			return
		}

		fileHeader, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "image file is required"})
			return
		}

		snapshot, err := h.service.SaveSnapshotMultipart(cameraID, fileHeader)
		if err != nil {
			if err.Error() == "camera_id not found in system" {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"status":      "success",
			"message":     "Snapshot recorded successfully",
			"snapshot_id": snapshot.ID,
			"file_path":   snapshot.FilePath,
			"created_at":  snapshot.CreatedAt,
		})
		return
	}

	var input CreateSnapshotJSONInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	snapshot, err := h.service.SaveSnapshotBase64(input.CameraID, input.ImageBase64)
	if err != nil {
		if err.Error() == "camera_id not found in system" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":      "success",
		"message":     "Snapshot recorded successfully",
		"snapshot_id": snapshot.ID,
		"file_path":   snapshot.FilePath,
		"created_at":  snapshot.CreatedAt,
	})
}

func (h *Handler) GetAll(c *gin.Context) {
	var query SnapshotQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.ListSnapshots(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch snapshots"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) GetStats(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch snapshot statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "snapshot id is required"})
		return
	}

	if err := h.service.DeleteSnapshot(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete snapshot"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Snapshot deleted successfully",
	})
}
