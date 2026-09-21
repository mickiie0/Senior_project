package notification

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	repo           Repository
	discordService DiscordService
}

func NewHandler(repo Repository, discordService DiscordService) *Handler {
	return &Handler{
		repo:           repo,
		discordService: discordService,
	}
}

func (h *Handler) GetLogs(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}

	logs, err := h.repo.GetLogs(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notification logs"})
		return
	}

	c.JSON(http.StatusOK, logs)
}

func (h *Handler) TestDiscord(c *gin.Context) {
	status, err := h.discordService.SendTestAlert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  status,
		"message": "Test notification successfully sent to Discord",
	})
}
