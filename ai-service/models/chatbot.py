"""
Campus AI Chatbot
Handles natural language queries about rooms, bookings, complaints, and campus info.
Uses intent detection + context-aware responses.
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime


class CampusChatbot:
    """
    Rule-based chatbot with intent detection and context-aware responses.
    Integrates live campus data (rooms, bookings) for accurate answers.
    """

    INTENTS = {
        "room_availability": [
            "free room", "available room", "empty room", "which room", "find room",
            "room available", "book a room", "free lab", "available lab",
        ],
        "booking_help": [
            "how to book", "booking", "reserve", "schedule", "book room",
        ],
        "complaint_help": [
            "complaint", "report", "issue", "problem", "broken", "not working",
        ],
        "timetable": [
            "timetable", "schedule", "class", "lecture", "when is",
        ],
        "greeting": [
            "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
        ],
        "help": [
            "help", "what can you do", "features", "capabilities", "assist",
        ],
        "room_types": [
            "lab", "classroom", "seminar", "auditorium", "meeting room",
        ],
        "stats": [
            "how many", "total", "count", "statistics", "analytics",
        ],
    }

    def respond(
        self,
        message: str,
        history: List[Dict],
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        msg_lower = message.lower().strip()
        intent = self._detect_intent(msg_lower)
        rooms = context.get("rooms", [])
        user_name = context.get("user_name", "there")
        current_time = context.get("current_time", datetime.now().isoformat())

        reply = self._generate_reply(intent, msg_lower, rooms, user_name, current_time)
        suggestions = self._get_suggestions(intent)

        return {"reply": reply, "suggestions": suggestions, "intent": intent}

    def _detect_intent(self, message: str) -> str:
        scores = {intent: 0 for intent in self.INTENTS}
        for intent, keywords in self.INTENTS.items():
            for kw in keywords:
                if kw in message:
                    scores[intent] += 1
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "general"

    def _generate_reply(
        self,
        intent: str,
        message: str,
        rooms: List[Dict],
        user_name: str,
        current_time: str,
    ) -> str:
        available_rooms = [r for r in rooms if r.get("current_status") == "available"]
        occupied_rooms = [r for r in rooms if r.get("current_status") == "occupied"]

        if intent == "greeting":
            hour = datetime.fromisoformat(current_time.replace("Z", "")).hour if current_time else 12
            greeting = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
            return (
                f"{greeting}, {user_name}! 👋 I'm your IntelliCampus AI assistant. "
                f"I can help you find available rooms, book spaces, track complaints, "
                f"and answer campus queries. What do you need today?"
            )

        elif intent == "room_availability":
            if not rooms:
                return "I don't have live room data right now. Please check the Room Booking page for current availability."

            # Filter by type if mentioned
            room_type = None
            if "lab" in message:
                room_type = "lab"
            elif "classroom" in message or "class" in message:
                room_type = "classroom"
            elif "seminar" in message:
                room_type = "seminar"
            elif "meeting" in message:
                room_type = "meeting"

            filtered = [r for r in available_rooms if not room_type or r.get("type") == room_type]

            if not filtered:
                return (
                    f"All {room_type or 'rooms'} appear to be occupied right now. "
                    f"Try checking back in 30 minutes, or use the Room Booking page to see upcoming free slots."
                )

            room_list = "\n".join([
                f"• **{r['name']}** ({r['building']}, Cap: {r['capacity']})"
                for r in filtered[:4]
            ])
            return (
                f"Here are the currently available {room_type or 'rooms'} 🟢:\n\n"
                f"{room_list}\n\n"
                f"There are **{len(available_rooms)}** rooms available out of {len(rooms)} total. "
                f"Click 'Book Now' on any room to reserve it!"
            )

        elif intent == "booking_help":
            return (
                "Booking a room is easy! Here's how:\n\n"
                "1. Go to **Room Booking** in the sidebar\n"
                "2. Browse available rooms or use filters\n"
                "3. Click **Book Now** on your preferred room\n"
                "4. Select date, time, and duration\n"
                "5. Confirm your booking ✅\n\n"
                "You'll get a real-time notification once confirmed. Need help finding a specific room?"
            )

        elif intent == "complaint_help":
            return (
                "To report an issue:\n\n"
                "1. Go to **Complaints** in the sidebar\n"
                "2. Click **New Complaint**\n"
                "3. Describe the issue — our AI will automatically classify its priority\n"
                "4. Track your complaint status in real-time\n\n"
                "🤖 Our AI prioritizes complaints as **Critical → High → Medium → Low** "
                "so urgent issues get resolved first!"
            )

        elif intent == "stats":
            total = len(rooms)
            avail = len(available_rooms)
            occ = len(occupied_rooms)
            return (
                f"📊 **Live Campus Stats:**\n\n"
                f"• Total rooms: **{total}**\n"
                f"• Available now: **{avail}** 🟢\n"
                f"• Occupied now: **{occ}** 🔴\n"
                f"• Availability rate: **{round(avail/total*100) if total else 0}%**\n\n"
                f"Check the Admin Dashboard for detailed analytics and heatmaps."
            )

        elif intent == "help":
            return (
                "Here's what I can help you with 🤖:\n\n"
                "🏠 **Room Availability** — Find free rooms/labs right now\n"
                "📅 **Booking Help** — Guide you through booking a room\n"
                "📋 **Complaints** — Report and track campus issues\n"
                "📊 **Campus Stats** — Live occupancy and analytics\n"
                "🔔 **Notifications** — Check your alerts\n\n"
                "Just ask me anything about the campus!"
            )

        else:
            # General fallback with context
            if "free" in message or "available" in message:
                return self._generate_reply("room_availability", message, rooms, user_name, current_time)
            return (
                f"I'm not sure I understood that, {user_name}. "
                f"I can help with room availability, bookings, complaints, and campus info. "
                f"Try asking: 'Which labs are free?' or 'How do I book a room?'"
            )

    def _get_suggestions(self, intent: str) -> List[str]:
        suggestions_map = {
            "greeting": ["Show available rooms", "How do I book a room?", "Campus stats"],
            "room_availability": ["Book a room", "Show all labs", "Show classrooms"],
            "booking_help": ["Show available rooms", "My bookings", "Cancel a booking"],
            "complaint_help": ["Track my complaints", "Report urgent issue", "View complaint status"],
            "stats": ["Show room heatmap", "View analytics", "Top used rooms"],
            "help": ["Find free rooms", "Book a room", "Report an issue"],
            "general": ["Show available rooms", "How do I book?", "Report an issue"],
        }
        return suggestions_map.get(intent, ["Show available rooms", "Book a room", "Report an issue"])
