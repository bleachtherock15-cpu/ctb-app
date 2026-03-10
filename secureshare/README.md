# SecureShare v4 — Security Platform

> Full-stack security platform — Node.js + Express + SQLite backend · Modern dark frontend

---

## 📁 Project Structure

```
secureshare/
├── backend/
│   ├── middleware/auth.js       # JWT middleware
│   ├── routes/auth.js           # Register / Login / Me
│   ├── routes/shares.js         # Upload / List / Download / Delete
│   ├── db.js                    # SQLite schema (auto-creates tables)
│   ├── server.js                # Express entry point
│   ├── package.json
│   └── .env                     # ⚠️ Change JWT_SECRET before deploy!
│
└── frontend/
    ├── css/main.css              # Modern dark theme
    ├── js/
    │   ├── api.js                # API client (Auth + Shares)
    │   ├── hash.js               # MD5 + SHA utilities
    │   ├── app.js                # Core app + toolkit logic
    │   └── geo.js                # GeoSight AI module
    ├── index.html                # Main app
    └── download.html             # Public share download page
```

---

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
npm install
npm run dev        # dev mode with auto-reload
# npm start        # production
```
Backend runs at: **http://localhost:3001**

### 2. Frontend
```bash
# Option A: VS Code Live Server (recommended)
# Right-click frontend/index.html → Open with Live Server

# Option B: npx serve
cd frontend && npx serve -p 3000

# Option C: Python
cd frontend && python -m http.server 3000
```
Frontend runs at: **http://localhost:3000**

---

## 📱 Modules

| # | Module | Description |
|---|--------|-------------|
| 01 | **File Share** | Upload files, generate share links, set expiry & download limits |
| 02 | **Cyber Toolkit** | Hash generator (MD5/SHA), URL risk scanner, Password analyzer, File metadata |
| 03 | **GeoSight AI** | Drop an image → Claude AI analyzes visual clues → GPS coordinates + Google Maps |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login → JWT |
| GET  | `/api/auth/me` | ✅ | Current user |
| POST | `/api/shares` | ✅ | Upload file |
| GET  | `/api/shares` | ✅ | List my shares |
| DELETE | `/api/shares/:id` | ✅ | Delete share |
| GET  | `/api/shares/dl/:token` | ❌ | Download (public) |
| GET  | `/api/shares/info/:token` | ❌ | Share info (public) |
| GET  | `/api/health` | ❌ | Health check |

---

## 🔑 .env Config

```env
PORT=3001
JWT_SECRET=change-this-secret-key   # ← IMPORTANT
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=52428800              # 50 MB
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🤖 GeoSight AI

Uses **Claude claude-sonnet-4-20250514** Vision to analyze:
- Road signs & street text
- Language/script on signs
- Architectural style
- Mountains, vegetation, terrain  
- Vehicles & license plates
- Temples, churches, landmarks
- Clothing, utility poles, etc.

Returns: Location name · Country · GPS lat/lng · Confidence · Visual clues · Reasoning · Alternative locations

> ⚠️ GPS coordinates are AI estimates, not exact GPS data.
