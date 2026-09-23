package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type DiscordEmbedField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type DiscordEmbedImage struct {
	URL string `json:"url"`
}

type DiscordEmbedFooter struct {
	Text string `json:"text"`
}

type DiscordEmbed struct {
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Color       int                 `json:"color"`
	Fields      []DiscordEmbedField `json:"fields"`
	Image       *DiscordEmbedImage  `json:"image,omitempty"`
	Footer      DiscordEmbedFooter  `json:"footer"`
	Timestamp   string              `json:"timestamp"`
}

type DiscordPayload struct {
	Username  string         `json:"username"`
	AvatarURL string         `json:"avatar_url"`
	Embeds    []DiscordEmbed `json:"embeds"`
}

type EventAlertData struct {
	EventID       string
	CameraID      string
	CameraName    string
	Location      string
	SubLocation   string
	DetectionType string
	Confidence    float64
	ImageURL      string
	CreatedAt     time.Time
}

type DiscordService interface {
	SendFireAlertAsync(data EventAlertData)
	SendTestAlert() (string, error)
}

type discordService struct {
	webhookURL string
	repo       Repository
	client     *http.Client
}

func NewDiscordService(webhookURL string, repo Repository) DiscordService {
	return &discordService{
		webhookURL: webhookURL,
		repo:       repo,
		client:     &http.Client{Timeout: 15 * time.Second},
	}
}

func (s *discordService) SendFireAlertAsync(data EventAlertData) {
	go func() {
		err := s.sendAlert(data)
		status := "SUCCESS"
		errMsg := ""
		if err != nil {
			status = "FAILED"
			errMsg = err.Error()
			log.Printf("[Discord] Failed to send alert for event %s: %v", data.EventID, err)
		} else {
			log.Printf("[Discord] Alert sent successfully for event %s", data.EventID)
		}

		// Save to notification_logs
		if s.repo != nil {
			maskedWebhook := maskURL(s.webhookURL)
			summaryMsg := fmt.Sprintf("Discord alert for %s at camera %s (%s)", data.EventID, data.CameraID, data.DetectionType)
			_ = s.repo.CreateLog(&NotificationLog{
				EventID:      data.EventID,
				Channel:      "DISCORD",
				Recipient:    maskedWebhook,
				Status:       status,
				Message:      summaryMsg,
				ErrorMessage: errMsg,
			})
		}
	}()
}

func (s *discordService) SendTestAlert() (string, error) {
	testData := EventAlertData{
		EventID:       "TEST-EVENT",
		CameraID:      "TEST-CAM",
		CameraName:    "กล้องทดสอบระบบ",
		Location:      "อาคารหลัก (Main Building)",
		SubLocation:   "ห้องทดสอบระบบ",
		DetectionType: "fire",
		Confidence:    0.99,
		CreatedAt:     time.Now(),
	}

	err := s.sendAlert(testData)
	if err != nil {
		if s.repo != nil {
			_ = s.repo.CreateLog(&NotificationLog{
				EventID:      testData.EventID,
				Channel:      "DISCORD",
				Recipient:    maskURL(s.webhookURL),
				Status:       "FAILED",
				Message:      "Test alert triggered",
				ErrorMessage: err.Error(),
			})
		}
		return "Failed", err
	}

	if s.repo != nil {
		_ = s.repo.CreateLog(&NotificationLog{
			EventID:   testData.EventID,
			Channel:   "DISCORD",
			Recipient: maskURL(s.webhookURL),
			Status:    "SUCCESS",
			Message:   "Test alert triggered successfully",
		})
	}
	return "Success", nil
}

func (s *discordService) sendAlert(data EventAlertData) error {
	if s.webhookURL == "" {
		return fmt.Errorf("discord webhook URL is not configured")
	}

	loc := time.FixedZone("ICT", 7*3600)
	localTime := data.CreatedAt.In(loc)
	timeStr := localTime.Format("02/01/2006 15:04:05")

	typeEmoji := "🔥"
	typeLabel := "เพลิงไหม้ (FIRE)"
	color := 14428710
	if strings.Contains(strings.ToLower(data.DetectionType), "smoke") {
		typeEmoji = "💨"
		typeLabel = "กลุ่มควัน (SMOKE)"
		color = 15582236
	}

	camLocation := data.CameraID
	if data.Location != "" {
		if data.SubLocation != "" {
			camLocation = fmt.Sprintf("%s (%s - %s)", data.CameraID, data.Location, data.SubLocation)
		} else {
			camLocation = fmt.Sprintf("%s (%s)", data.CameraID, data.Location)
		}
	}

	confPercent := fmt.Sprintf("%.2f%%", data.Confidence*100)

	embed := DiscordEmbed{
		Title:       "🚨 ตรวจพบสัญญาณเพลิงไหม้ฉุกเฉิน!",
		Description: "ระบบตรวจจับไฟและควันจากกล้องวงจรปิด ตรวจพบเหตุการณ์ผิดปกติในพื้นที่ กรุณาตรวจสอบทันที!",
		Color:       color,
		Fields: []DiscordEmbedField{
			{Name: "🆔 รหัสเหตุการณ์ (Event ID)", Value: fmt.Sprintf("`%s`", data.EventID), Inline: true},
			{Name: "📹 กล้องที่ตรวจพบ", Value: camLocation, Inline: true},
			{Name: "", Value: "", Inline: false},
			{Name: fmt.Sprintf("%s ประเภทการตรวจจับ", typeEmoji), Value: fmt.Sprintf("**%s**", typeLabel), Inline: true},
			{Name: "🎯 ความมั่นใจ (Confidence)", Value: fmt.Sprintf("**%s**", confPercent), Inline: true},
			{Name: "", Value: "", Inline: false},
			{Name: "⏰ วัน-เวลาที่ตรวจพบ", Value: timeStr, Inline: true},
		},
		Footer: DiscordEmbedFooter{
			Text: "Fire & Smoke Detection System from CCTV • Automated Emergency Alert",
		},
		Timestamp: data.CreatedAt.UTC().Format(time.RFC3339),
	}

	var imageFilePath string
	if data.ImageURL != "" {
		if strings.HasPrefix(data.ImageURL, "http://") || strings.HasPrefix(data.ImageURL, "https://") {
			embed.Image = &DiscordEmbedImage{URL: data.ImageURL}
		} else {
			relPath := strings.TrimPrefix(data.ImageURL, "/")
			if fi, err := os.Stat(relPath); err == nil && !fi.IsDir() {
				imageFilePath = relPath
			}
		}
	}

	payload := DiscordPayload{
		Username:  "Fire & Smoke Detection Alert",
		AvatarURL: "https://cdn-icons-png.flaticon.com/512/785/785116.png",
		Embeds:    []DiscordEmbed{embed},
	}

	if imageFilePath != "" {
		return s.sendMultipart(payload, imageFilePath)
	}

	return s.sendJSON(payload)
}

func (s *discordService) sendJSON(payload DiscordPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := s.client.Post(s.webhookURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("discord returned status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (s *discordService) sendMultipart(payload DiscordPayload, filePath string) error {
	fileData, err := os.ReadFile(filePath)
	if err != nil {
		return s.sendJSON(payload) // fallback to JSON
	}

	filename := filepath.Base(filePath)
	payload.Embeds[0].Image = &DiscordEmbedImage{
		URL: fmt.Sprintf("attachment://%s", filename),
	}

	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	if err := w.WriteField("payload_json", string(jsonBytes)); err != nil {
		return err
	}

	part, err := w.CreateFormFile("files[0]", filename)
	if err != nil {
		return err
	}

	if _, err := part.Write(fileData); err != nil {
		return err
	}

	if err := w.Close(); err != nil {
		return err
	}

	req, err := http.NewRequest("POST", s.webhookURL, &b)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("discord returned status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func maskURL(url string) string {
	parts := strings.Split(url, "/")
	if len(parts) >= 2 {
		token := parts[len(parts)-1]
		if len(token) > 8 {
			parts[len(parts)-1] = token[:4] + "..." + token[len(token)-4:]
		}
		return strings.Join(parts, "/")
	}
	return url
}
