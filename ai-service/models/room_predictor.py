"""
Room Availability Predictor
Uses a rule-based + statistical model to predict room availability.
In production, replace with a trained scikit-learn RandomForest or LSTM model.
"""

import numpy as np
from datetime import datetime
from typing import Dict, Any, List


class RoomPredictor:
    """
    Predicts room availability probability based on:
    - Day of week (weekdays vs weekends)
    - Hour of day (peak vs off-peak)
    - Room type (labs are busier than meeting rooms)
    - Historical booking patterns (simulated)
    """

    # Historical occupancy patterns by hour (0-23) — simulated from real campus data
    HOURLY_PATTERNS = {
        "lab":       [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.10, 0.30,
                      0.75, 0.90, 0.95, 0.85, 0.70, 0.80, 0.90, 0.85,
                      0.70, 0.50, 0.30, 0.15, 0.10, 0.05, 0.05, 0.05],
        "classroom": [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.10, 0.40,
                      0.85, 0.95, 0.90, 0.80, 0.60, 0.85, 0.90, 0.80,
                      0.60, 0.40, 0.20, 0.10, 0.05, 0.05, 0.05, 0.05],
        "seminar":   [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.20,
                      0.50, 0.70, 0.75, 0.65, 0.55, 0.70, 0.75, 0.65,
                      0.50, 0.35, 0.20, 0.10, 0.05, 0.05, 0.05, 0.05],
        "meeting":   [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.15,
                      0.40, 0.60, 0.70, 0.65, 0.55, 0.65, 0.70, 0.60,
                      0.45, 0.30, 0.15, 0.05, 0.05, 0.05, 0.05, 0.05],
        "auditorium":[0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.10,
                      0.20, 0.30, 0.40, 0.35, 0.30, 0.40, 0.45, 0.40,
                      0.35, 0.25, 0.15, 0.10, 0.05, 0.05, 0.05, 0.05],
    }

    WEEKEND_FACTOR = 0.25  # Rooms are 75% less busy on weekends
    PEAK_HOURS = {9, 10, 11, 14, 15, 16}

    def predict(self, room_id: str, room_type: str, capacity: int, datetime_str: str) -> Dict[str, Any]:
        try:
            dt = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
        except Exception:
            dt = datetime.now()

        hour = dt.hour
        day_of_week = dt.weekday()  # 0=Monday, 6=Sunday
        is_weekend = day_of_week >= 5

        # Base occupancy probability from pattern
        pattern = self.HOURLY_PATTERNS.get(room_type, self.HOURLY_PATTERNS["classroom"])
        base_occupancy = pattern[hour]

        # Apply weekend factor
        if is_weekend:
            base_occupancy *= self.WEEKEND_FACTOR

        # Add small random noise for realism
        noise = np.random.normal(0, 0.05)
        occupancy_prob = float(np.clip(base_occupancy + noise, 0.0, 1.0))

        # Availability is inverse of occupancy
        availability_prob = round(1.0 - occupancy_prob, 2)

        # Predicted occupancy count
        predicted_occupancy = int(capacity * occupancy_prob)

        # Confidence based on how well-defined the pattern is
        confidence = 0.85 if hour in self.PEAK_HOURS else 0.72

        # Generate best available slots for the day
        best_slots = self._get_best_slots(room_type, is_weekend)

        # Human-readable recommendation
        recommendation = self._get_recommendation(availability_prob, hour, is_weekend)

        return {
            "availability_probability": availability_prob,
            "occupancy_probability": round(occupancy_prob, 2),
            "predicted_occupancy": predicted_occupancy,
            "confidence": confidence,
            "best_slots": best_slots,
            "recommendation": recommendation,
            "is_peak_hour": hour in self.PEAK_HOURS,
            "is_weekend": is_weekend,
        }

    def _get_best_slots(self, room_type: str, is_weekend: bool) -> List[str]:
        pattern = self.HOURLY_PATTERNS.get(room_type, self.HOURLY_PATTERNS["classroom"])
        # Find hours with lowest occupancy (most available) during working hours
        working_hours = range(8, 20)
        slots = sorted(working_hours, key=lambda h: pattern[h])
        best = slots[:4]
        return [f"{h:02d}:00" for h in sorted(best)]

    def _get_recommendation(self, availability: float, hour: int, is_weekend: bool) -> str:
        if is_weekend:
            return "Weekend — most rooms are available. Great time to book!"
        if availability >= 0.8:
            return "High availability — excellent time to book this room."
        elif availability >= 0.6:
            return "Moderate availability — book soon to secure your slot."
        elif availability >= 0.4:
            return "Low availability — consider an alternative time or room."
        else:
            return "Very busy period — recommend booking a different time slot."
