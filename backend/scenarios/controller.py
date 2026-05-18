import json
import re

import anthropic

from config import settings

Message = dict[str, str]


class ScenarioController:
    """Drives a scenario-based conversation and tracks goal completion."""

    def __init__(self, scenario: dict, session_id: str):
        self.scenario = scenario
        self.session_id = session_id
        self._client: anthropic.Anthropic | None = None

    def _get_client(self) -> anthropic.Anthropic:
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        return self._client

    def get_system_prompt(self) -> str:
        goals = "\n".join(f"- {g}" for g in self.scenario.get("goal_state", []))
        return f"""You are playing a role in an English learning scenario.

Scenario: {self.scenario['title']}
Context: {self.scenario['context']}
Difficulty: {self.scenario.get('difficulty', 'beginner')}

Your role:
- Stay in character as the other person in this situation (server, school staff, receptionist, etc.).
- Use natural, clear English appropriate for the difficulty level.
- Ask clarifying questions when realistic (e.g., size, time, spelling).
- Keep responses concise (1-3 sentences) unless more detail is needed.
- Gently guide the learner toward completing these goals without breaking character:
{goals}

Success criteria: {self.scenario.get('success_criteria', '')}

Rules:
- Never break the fourth wall or mention that this is practice.
- Do not evaluate the learner; only respond in character.
- If the learner completes all goals, wrap up the interaction naturally."""

    def check_goal_completion(self, conversation_history: list[Message]) -> bool:
        if not conversation_history:
            return False

        goals = self.scenario.get("goal_state", [])
        if not goals:
            return False

        history_text = self._format_history(conversation_history)
        prompt = f"""Analyze this English practice conversation and determine if ALL goals are met.

Goals:
{chr(10).join(f'- {g}' for g in goals)}

Conversation:
{history_text}

Respond with ONLY valid JSON:
{{"all_goals_met": true or false, "completed_goals": ["list of met goals"], "remaining_goals": ["list of unmet goals"]}}"""

        if not settings.anthropic_api_key:
            return self._heuristic_goal_check(conversation_history, goals)

        try:
            response = self._get_client().messages.create(
                model=settings.anthropic_model,
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return bool(data.get("all_goals_met", False))
        except Exception:
            pass

        return self._heuristic_goal_check(conversation_history, goals)

    def _heuristic_goal_check(self, history: list[Message], goals: list[str]) -> bool:
        user_text = " ".join(
            m["content"].lower() for m in history if m.get("role") == "user"
        )
        if len(user_text.split()) < 8:
            return False
        assistant_turns = sum(1 for m in history if m.get("role") == "assistant")
        return assistant_turns >= 3 and len(history) >= 6

    def get_next_response(self, conversation_history: list[Message]) -> str:
        if not conversation_history:
            return self.scenario.get("opening_line", "Hello! How can I help you?")

        if not settings.anthropic_api_key:
            return self._fallback_response(conversation_history)

        messages = [{"role": "user", "content": self.get_system_prompt()}]
        messages.append(
            {
                "role": "assistant",
                "content": "Understood. I will stay in character and guide the learner.",
            }
        )

        for msg in conversation_history:
            role = msg.get("role", "user")
            api_role = "user" if role == "user" else "assistant"
            messages.append({"role": api_role, "content": msg["content"]})

        try:
            response = self._get_client().messages.create(
                model=settings.anthropic_model,
                max_tokens=300,
                system=self.get_system_prompt(),
                messages=[
                    {"role": m["role"], "content": m["content"]}
                    for m in conversation_history
                ],
            )
            return response.content[0].text.strip()
        except Exception:
            return self._fallback_response(conversation_history)

    def _fallback_response(self, history: list[Message]) -> str:
        turn = sum(1 for m in history if m.get("role") == "assistant")
        fallbacks = [
            "Sure, I can help with that. What would you like?",
            "Could you tell me a bit more?",
            "Great choice! Anything else for you today?",
            "Perfect. Is there anything else I can help you with?",
        ]
        return fallbacks[min(turn, len(fallbacks) - 1)]

    @staticmethod
    def _format_history(history: list[Message]) -> str:
        lines = []
        for msg in history:
            role = msg.get("role", "unknown").upper()
            lines.append(f"{role}: {msg.get('content', '')}")
        return "\n".join(lines)
