package detection

import (
	"fmt"
	"net/http"
	"time"

	"fire_detection_web_app/internal/sse"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
	hub     *sse.Hub
}

func NewHandler(service Service, hub *sse.Hub) *Handler {
	return &Handler{
		service: service,
		hub:     hub,
	}
}

func (h *Handler) ReceiveEvent(c *gin.Context) {
	var input CreateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event, err := h.service.ProcessEvent(input)
	if err != nil {
		if err.Error() == "camera_id not found in system" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process detection event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "success",
		"message":  "Detection event recorded successfully",
		"event_id": event.EventID,
	})
}

func (h *Handler) GetAll(c *gin.Context) {
	events, err := h.service.GetAllEvents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch detection events"})
		return
	}

	c.JSON(http.StatusOK, events)
}

func (h *Handler) StreamEvents(c *gin.Context) {
	if h.hub == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SSE hub not configured"})
		return
	}

	clientChan := make(chan string, 20)
	h.hub.Register(clientChan)
	defer h.hub.Unregister(clientChan)

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
	c.Writer.Flush()

	// Initial handshake event
	connectedPayload := fmt.Sprintf("event: connected\ndata: {\"status\":\"connected\",\"time\":\"%s\"}\n\n", time.Now().Format(time.RFC3339))
	if _, err := c.Writer.WriteString(connectedPayload); err != nil {
		return
	}
	c.Writer.Flush()

	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	ctx := c.Request.Context()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := c.Writer.WriteString(": ping\n\n"); err != nil {
				return
			}
			c.Writer.Flush()
		case msg, ok := <-clientChan:
			if !ok {
				return
			}
			if _, err := c.Writer.WriteString(msg); err != nil {
				return
			}
			c.Writer.Flush()
		}
	}
}