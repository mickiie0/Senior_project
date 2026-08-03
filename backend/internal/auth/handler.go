package auth

import "github.com/gin-gonic/gin"

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) Register(c *gin.Context) {

	var req RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	if err := h.service.Register(req); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(201, gin.H{
		"message": "register success",
	})
}

func (h *Handler) Login(c *gin.Context) {

	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	token, err := h.service.Login(req)

	if err != nil {

		c.JSON(401, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(200, LoginResponse{
		Token: token,
	})
}
