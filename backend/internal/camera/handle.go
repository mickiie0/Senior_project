package camera

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

type TestIPInput struct {
	IPAddress string `json:"ip_address" binding:"required,ip"`
}

// TestConnection เพิ่ม Handler สำหรับปุ่ม "ทดสอบ IP" จากหน้า React
func (h *Handler) TestConnection(c *gin.Context) {
	var input TestIPInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ IP Address ที่ถูกต้อง"})
		return
	}

	isAlive := PingReCamera(input.IPAddress, 2*time.Second)

	c.JSON(http.StatusOK, gin.H{
		"ip":     input.IPAddress,
		"online": isAlive,
	})
}

func (h *Handler) Create(c *gin.Context) {
	var input CreateCameraInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cam, err := h.service.CreateCamera(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, cam)
}

func (h *Handler) GetAll(c *gin.Context) {
	cameras, err := h.service.GetAllCameras()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cameras)
}

func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	cam, err := h.service.GetCameraByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Camera not found"})
		return
	}

	c.JSON(http.StatusOK, cam)
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var input UpdateCameraInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cam, err := h.service.UpdateCamera(id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cam)
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.DeleteCamera(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Camera deleted successfully"})
}