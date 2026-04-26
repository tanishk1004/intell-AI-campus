"""
IntelliCampus AI+ – FastAPI AI Service
Endpoints:
  POST /predict-room        → Room availability prediction
  POST /classify-complaint  → NLP complaint classification
  POST /chatbot             → Campus AI chatbot
  POST /recommend-rooms     → Smart room recommendations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

from models.room_predictor import RoomPredictor
from models.complaint_classifier import ComplaintClassifier
from models.chatbot import CampusChatbot

load_dotenv()

app = FastAPI(
    title="IntelliCampus AI Service",
    description="AI microservice for room prediction, complaint classification, and chatbot",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialize models ────────────────────────────────────────
room_predictor = RoomPredictor()
complaint_classifier = ComplaintClassifier()
chatbot = CampusChatbot()


# ── Schemas ──────────────────────────────────────────────────
class RoomPredictRequest(BaseModel):
    room_id: str
    room_type: str
    capacity: int
    datetime: str


class ComplaintRequest(BaseModel):
    title: str
    description: str


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    context: Optional[Dict[str, Any]] = {}


class RecommendRequest(BaseModel):
    purpose: Optional[str] = "general"
    attendees: Optional[int] = 1
    preferred_time: Optional[str] = None
    duration_hours: Optional[float] = 1.0
    available_rooms: Optional[List[Dict]] = []


# ── Routes ───────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "IntelliCampus AI", "version": "1.0.0"}


@app.post("/predict-room")
def predict_room(req: RoomPredictRequest):
    """
    Predict room availability probability for a given datetime.
    Returns: availability_probability (0-1), predicted_occupancy, confidence, best_slots
    """
    try:
        result = room_predictor.predict(
            room_id=req.room_id,
            room_type=req.room_type,
            capacity=req.capacity,
            datetime_str=req.datetime,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/classify-complaint")
def classify_complaint(req: ComplaintRequest):
    """
    Classify complaint priority and category using NLP.
    Returns: priority (critical/high/medium/low), category, confidence, reasoning
    """
    try:
        result = complaint_classifier.classify(
            title=req.title,
            description=req.description,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chatbot")
def chatbot_response(req: ChatRequest):
    """
    Campus AI chatbot with context awareness.
    Returns: reply, suggestions
    """
    try:
        result = chatbot.respond(
            message=req.message,
            history=req.history or [],
            context=req.context or {},
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend-rooms")
def recommend_rooms(req: RecommendRequest):
    """
    AI-powered room recommendations based on purpose, attendees, and time.
    """
    try:
        rooms = req.available_rooms or []
        recommendations = []

        for room in rooms:
            score = _score_room(room, req.purpose, req.attendees, req.duration_hours)
            recommendations.append({
                **room,
                "score": round(score, 2),
                "reason": _get_reason(room, req.purpose, req.attendees),
            })

        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return {"recommendations": recommendations[:3]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _score_room(room: dict, purpose: str, attendees: int, duration: float) -> float:
    score = 0.5
    capacity = room.get("capacity", 0)
    room_type = room.get("type", "")
    amenities = room.get("amenities", [])

    # Capacity fit (ideal: 60-80% full)
    if attendees and capacity:
        ratio = attendees / capacity
        if 0.5 <= ratio <= 0.85:
            score += 0.25
        elif ratio < 0.5:
            score += 0.1
        elif ratio > 1:
            score -= 0.3

    # Type match
    purpose_type_map = {
        "lecture": "classroom",
        "lab": "lab",
        "meeting": "meeting",
        "seminar": "seminar",
        "event": "auditorium",
    }
    if purpose and purpose_type_map.get(purpose.lower()) == room_type:
        score += 0.2

    # Amenities bonus
    if "projector" in amenities:
        score += 0.05
    if "ac" in amenities:
        score += 0.05

    return min(score, 1.0)


def _get_reason(room: dict, purpose: str, attendees: int) -> str:
    reasons = []
    if room.get("capacity", 0) >= (attendees or 1):
        reasons.append(f"fits {attendees} attendees")
    if purpose and purpose.lower() in room.get("type", ""):
        reasons.append(f"ideal for {purpose}")
    if "projector" in room.get("amenities", []):
        reasons.append("has projector")
    if "ac" in room.get("amenities", []):
        reasons.append("air conditioned")
    return ", ".join(reasons) if reasons else "Good general-purpose room"


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
