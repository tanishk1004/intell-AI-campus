# IntelliCampus AI+ 🎓🤖
### Autonomous AI Brain for Smart Campuses

> A startup-level, hackathon-ready AI platform that transforms campus operations through intelligent prediction, automation, and real-time insights.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              React.js + Tailwind + Framer Motion            │
│   Home | Dashboard | Booking | Complaints | Chatbot | Admin │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API (Axios)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│                  Node.js + Express + JWT                    │
│     Auth | Rooms | Bookings | Complaints | Predictions      │
└──────────┬──────────────────────────┬───────────────────────┘
           │ PostgreSQL                │ HTTP (FastAPI)
           ▼                          ▼
┌──────────────────┐      ┌──────────────────────────────────┐
│   PostgreSQL DB  │      │         AI SERVICE               │
│  Users, Rooms,   │      │   Python FastAPI                 │
│  Bookings,       │      │   /predict-room                  │
│  Complaints,     │      │   /classify-complaint            │
│  Predictions     │      │   /chatbot                       │
└──────────────────┘      └──────────────────────────────────┘
```

---

## 📁 Project Structure

```
AI CAMPUS/
├── frontend/          # React.js app
├── backend/           # Node.js + Express API
├── ai-service/        # Python FastAPI AI models
└── README.md
```

---

## 🚀 Quick Start

### 1. Database Setup
```bash
cd backend
psql -U postgres -f schema.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### 3. AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend
npm install
npm start
```

---

## 🌐 Deployment

| Service   | Platform         |
|-----------|-----------------|
| Frontend  | Vercel           |
| Backend   | Render           |
| Database  | Railway (Postgres)|
| AI Service| Render (FastAPI) |

---

## 🎤 Demo Pitch (90 seconds)

1. **Login** as student → see AI dashboard with live predictions
2. **Room Booking** → AI recommends best room + time slot (with % confidence)
3. **Raise Complaint** → NLP instantly classifies as HIGH/MEDIUM/LOW priority
4. **Chatbot** → Ask "Which labs are free at 3pm?" → instant AI response
5. **Admin Panel** → Show heatmaps, analytics, complaint queue sorted by AI priority

---

## 👥 Roles

- **Student**: Book rooms, raise complaints, use chatbot, view predictions
- **Admin**: Full analytics, manage all bookings/complaints, view AI insights

---

## 🔑 Demo Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@intellicampus.ai | Admin@123  |
| Student | student@intellicampus.ai| Student@123|
