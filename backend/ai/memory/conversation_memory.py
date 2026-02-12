from typing import Dict, List, Any, Optional
from datetime import datetime
import json


class ConversationMemory:
    """
    Contextual memory for tracking career goals, previous advice, and skill progression.
    Future-proofs for long conversations by maintaining user context across sessions.
    """

    def __init__(self, max_history: int = 10):
        self.max_history = max_history
        self.memory: Dict[str, Any] = {
            "career_goals": [],
            "previous_advice": [],
            "skill_progression": {},
            "conversation_history": []
        }

    def update_career_goals(self, goals: List[str]):
        """Update user's career goals."""
        self.memory["career_goals"] = goals

    def add_advice(self, advice: str, context: Dict[str, Any]):
        """Add previous advice given to user."""
        advice_entry = {
            "advice": advice,
            "timestamp": datetime.now().isoformat(),
            "context": context
        }
        self.memory["previous_advice"].append(advice_entry)
        # Keep only recent advice
        if len(self.memory["previous_advice"]) > self.max_history:
            self.memory["previous_advice"] = self.memory["previous_advice"][-self.max_history:]

    def update_skill_progression(self, skill_id: int, new_score: float, old_score: Optional[float] = None):
        """Track skill progression over time."""
        if skill_id not in self.memory["skill_progression"]:
            self.memory["skill_progression"][skill_id] = []

        progression_entry = {
            "score": new_score,
            "timestamp": datetime.now().isoformat(),
            "improvement": new_score - (old_score or 0)
        }
        self.memory["skill_progression"][skill_id].append(progression_entry)

        # Keep only recent entries per skill
        if len(self.memory["skill_progression"][skill_id]) > self.max_history:
            self.memory["skill_progression"][skill_id] = self.memory["skill_progression"][skill_id][-self.max_history:]

    def add_conversation_entry(self, user_query: str, assistant_response: str, intent: str):
        """Add a conversation entry to history."""
        entry = {
            "user_query": user_query,
            "assistant_response": assistant_response,
            "intent": intent,
            "timestamp": datetime.now().isoformat()
        }
        self.memory["conversation_history"].append(entry)

        # Keep only recent conversations
        if len(self.memory["conversation_history"]) > self.max_history:
            self.memory["conversation_history"] = self.memory["conversation_history"][-self.max_history:]

    def get_context_for_response(self, current_intent: str) -> Dict[str, Any]:
        """Get relevant context for generating responses."""
        context = {
            "career_goals": self.memory["career_goals"],
            "recent_advice": [entry["advice"] for entry in self.memory["previous_advice"][-3:]],
            "skill_improvements": {}
        }

        # Get recent skill improvements
        for skill_id, progression in self.memory["skill_progression"].items():
            if progression:
                latest = progression[-1]
                if latest["improvement"] > 0:
                    context["skill_improvements"][skill_id] = latest["improvement"]

        # Add conversation history for context
        context["conversation_history"] = self.memory["conversation_history"][-5:]

        return context

    def get_memory_summary(self) -> str:
        """Get a summary of the user's memory for debugging or display."""
        summary = f"Career Goals: {', '.join(self.memory['career_goals'])}\n"
        summary += f"Previous Advice Count: {len(self.memory['previous_advice'])}\n"
        summary += f"Skills Tracked: {len(self.memory['skill_progression'])}\n"
        summary += f"Conversation History: {len(self.memory['conversation_history'])} entries\n"
        return summary

    def to_json(self) -> str:
        """Serialize memory to JSON for persistence."""
        return json.dumps(self.memory, indent=2)

    def from_json(self, json_str: str):
        """Load memory from JSON."""
        self.memory = json.loads(json_str)
