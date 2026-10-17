# 🔥Real-Time Fire and Smoke Detection System from CCTV Cameras Using Deep Learning Technique

> **Senior Project**: ระบบเฝ้าระวัง แจ้งเตือน และตรวจจับอัคคีภัย (ไฟและควัน) แบบ Real-time ผ่านกล้องวงจรปิด / Edge Camera พร้อมการแจ้งเตือนผ่าน Discord และ Dashboard สำหรับบริหารจัดการ

---

## 📌 บทนำและภาพรวม (Project Overview)
โปรเจกต์นี้พัฒนาขึ้นเพื่อเพิ่มประสิทธิภาพและความรวดเร็วในการเฝ้าระวังอัคคีภัย โดยรับข้อมูลการตรวจจับ (Detection Events) และภาพถ่าย (Snapshots) จากกล้องวงจรปิด/Edge Devices แบบเรียลไทม์ พร้อมประมวลผล แจ้งเตือนเจ้าหน้าที่ผ่าน **Discord Webhook** ทันที และแสดงผลการแจ้งเตือนแบบสด (Live Streaming) บนเว็บแดชบอร์ดด้วยเทคโนโลยี **Server-Sent Events (SSE)**

---

## ✨ ฟีเจอร์หลัก (Key Features)

### 1. 🔍 ระบบตรวจจับและคัดกรองอัคคีภัย (Detection & Filtering)
- รองรับการรับข้อมูล Event จาก Edge AI / กล้องพร้อมพิกัด Bounding Box และ Confidence Score
- กรองความน่าจะเป็นขั้นต่ำเพื่อลด False Positive:
  - **Fire (ไฟ)**: Confidence $\ge 0.60$
  - **Smoke (ควัน)**: Confidence $\ge 0.40$
- ถอดรหัสและบันทึกภาพถ่ายเหตุการณ์ (Base64) จัดเก็บลงโฟลเดอร์เซิร์ฟเวอร์แบบอัตโนมัติ

### 2. ⚡ การแจ้งเตือนทันที (Real-time Notification)
- **Discord Webhook**: แจ้งเตือนเหตุการณ์พร้อมรายละเอียด ตำแหน่งกล้อง ระดับความเชื่อมั่น และรูปถ่ายของเหตุการณ์ทันที
- **Server-Sent Events (SSE)**: ส่งสัญญาณแจ้งเตือนและอัปเดตข้อมูลบน Web Dashboard แบบสดโดยไม่ต้องรีเฟรชหน้าจอ

### 3. 📹 ระบบจัดการกล้องและภาพถ่าย (Camera & Snapshot Management)
- **Camera Management**: เพิ่ม, แก้ไข, ลบ และตรวจสอบสถานะการเชื่อมต่อ (Ping Check Worker อัตโนมัติทุก 1 นาที)
- **Snapshot Retention Policy**: เก็บภาพถ่ายอัตโนมัติ พร้อมระบบ Background Worker ลบภาพเก่าที่เกิน 90 วันเพื่อประหยัดพื้นที่ดิสก์

### 4. 🔐 ความปลอดภัยและการจัดการสิทธิ์ (Security & RBAC)
- **Camera Authentication**: การส่งข้อมูลจากกล้อง/สคริปต์ตรวจจับต้องผ่านการยืนยันตัวตนด้วย Header `X-API-Key`
- **User Authentication**: ระบบลงทะเบียน เข้าสู่ระบบ และจัดการรหัสผ่านด้วย JSON Web Token (JWT)
- **Role-Based Access Control (RBAC)**: แบ่งสิทธิ์ผู้ใช้งาน (`admin` และ `user`)
  - ซ่อน IP Address ของกล้องสำหรับผู้ใช้งานทั่วไปเพื่อความปลอดภัย
  - จำกัดสิทธิ์การจัดการกล้องและ Snapshot ให้เฉพาะ Admin เท่านั้น

---

## 🛠️ โครงสร้างเทคโนโลยี (Tech Stack)

### Backend
- **Language**: Go (Golang 1.24+)
- **Web Framework**: [Gin Gonic](https://github.com/gin-gonic/gin)
- **ORM**: [GORM](https://gorm.io/)
- **Configuration**: [Viper](https://github.com/spf13/viper)
- **Authentication**: JWT (golang-jwt) + Bcrypt
- **Real-time**: Server-Sent Events (SSE)

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Styling**: Vanilla CSS / Scoped Component Styles

### Database & Infrastructure
- **Database**: PostgreSQL 17
- **Database Admin UI**: pgAdmin 4
- **Containerization**: Docker & Docker Compose

---

## 📁 โครงสร้างโฟลเดอร์ (Project Structure)

```text
Senior_project/
├── backend/
│   ├── internal/
│   │   ├── auth/          # ระบบ Authentication (JWT, RBAC, Camera Middleware)
│   │   ├── camera/        # จัดการกล้อง และ Background Ping Worker
│   │   ├── detection/     # ประมวลผล Event ไฟ/ควัน และการบันทึกภาพ
│   │   ├── notification/  # จัดการ Discord Webhook และ Notification Logs
│   │   ├── snapshot/      # จัดการ Snapshot และ Cleanup Retention Worker
│   │   └── sse/           # Hub สำหรับกระจาย Event แบบ Real-time
│   ├── uploads/           # โฟลเดอร์เก็บไฟล์ภาพเหตุการณ์และ Snapshot
│   ├── Dockerfile         # Dockerfile สำหรับ Backend Go
│   ├── main.go            # Entry point ของ Backend API Server
│   └── .env               # Environment variable config ของ backend
├── frontend/
│   ├── public/            # ไฟล์ HTML, Icons, Manifest
│   ├── src/
│   │   ├── components/    # Components ย่อย เช่น Modal, Navbar, Stats Card
│   │   ├── pages/         # หน้า Dashboard, Cameras, Snapshots, History, Auth
│   │   └── App.js         # จุดศูนย์กลาง Route ของ React
│   └── Dockerfile         # Dockerfile สำหรับ Frontend React
├── database/              # Init scripts หรือ schema สำหรับฐานข้อมูล
├── docker-compose.yml     # สำหรับ Start ระบบทั้งหมด (DB, Backend, Frontend, pgAdmin)
└── README.md              # เอกสารอธิบายโปรเจกต์
```

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำ สะดวกที่สุด)

1. ตรวจสอบว่าได้ติดตั้ง **Docker** และ **Docker Desktop** บนเครื่องแล้ว
2. สร้างหรือตรวจสอบไฟล์ `.env` ที่ root directory:
   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   DISCORD_INVITE_URL=https://discord.gg/...
   ```
3. สั่งรันเซอร์วิสทั้งหมดผ่าน Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
4. เข้าใช้งานระบบ:
   - **Frontend Dashboard**: [http://localhost:8081](http://localhost:8081)
   - **Backend API**: [http://localhost:8080](http://localhost:8080)
   - **pgAdmin**: [http://localhost:5050](http://localhost:5050) (User: `admin@example.com`, Pass: `admin123`)

---

### วิธีที่ 2: รันแบบ Manual (Local Development)

#### 1. เตรียม Database (PostgreSQL)
สร้างฐานข้อมูลชื่อ `fire_detection` และตั้งค่าการเชื่อมต่อใน `backend/.env`:
```env
DATABASE_URL=postgres://admin:password@localhost:5432/fire_detection?sslmode=disable&TimeZone=Asia/Bangkok
PORT=8080
JWT_SECRET=your_jwt_secret_key
CAMERA_API_KEY=your_camera_secret_key
DISCORD_WEBHOOK_URL=your_discord_webhook_url
FRONTEND_URL=http://localhost:3000
```

#### 2. รัน Backend (Go)
```bash
cd backend
go mod download
go run main.go
```
เซิร์ฟเวอร์จะรันที่พอร์ต `8080` (พร้อม Auto Migration ตารางใน Database ให้ทันที)

#### 3. รัน Frontend (React)
```bash
cd frontend
npm install
npm start
```
เปิดบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🔌 ตัวอย่าง API Endpoints หลัก (API Reference)

| Method | Endpoint | สิทธิ์ (Auth) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | สมัครสมาชิกผู้ใช้งานใหม่ |
| `POST` | `/auth/login` | Public | เข้าสู่ระบบ และรับ JWT Token |
| `POST` | `/api/detections` | `X-API-Key` (Camera) | ส่งเหตุการณ์ตรวจจับไฟ/ควันจากกล้อง |
| `POST` | `/api/snapshots` | `X-API-Key` (Camera) | อัปโหลด Snapshot ภาพจากกล้อง |
| `GET` | `/api/detections` | User / Admin (JWT) | ดึงประวัติเหตุการณ์ตรวจจับทั้งหมด |
| `GET` | `/api/events/stream`| User / Admin (JWT) | SSE Stream สำหรับรับ Event แบบ Real-time |
| `GET` | `/api/cameras` | User / Admin (JWT) | ดึงรายการกล้องทั้งหมด (ซ่อน IP สำหรับ User) |
| `POST` | `/api/cameras` | Admin Only (JWT) | เพิ่มข้อมูลกล้องใหม่เข้าสู่ระบบ |
| `GET` | `/api/snapshots` | Admin Only (JWT) | ดูรายการ Snapshots และสถิติ |

---

## 👥 ผู้พัฒนา (Authors)
- **Senior Project**: Fire and Smoke Detection System
- **Faculty / University**: Senior Project
