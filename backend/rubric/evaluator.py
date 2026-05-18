import json
import re

import anthropic

from config import settings
from rubric.schema import STANDARD_DIMENSIONS, RubricDimension, RubricSchema


class RubricEvaluator:
    """LLM-based rubric evaluator using Claude."""

    def __init__(self):
        self._client: anthropic.Anthropic | None = None

    def _get_client(self) -> anthropic.Anthropic:
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        return self._client

    def evaluate(self, conversation_history: list[dict], scenario: dict) -> RubricSchema:
        weights = scenario.get(
            "rubric_weights",
            {d["name"]: 0.25 for d in STANDARD_DIMENSIONS},
        )
        rubric = RubricSchema.empty(weights=weights)

        if not settings.anthropic_configured:
            return self._heuristic_evaluate(conversation_history, rubric)

        history_text = self._format_history(conversation_history)
        dimension_specs = "\n".join(
            f"- {d['name']}: {d['description']} (score 1-5)" for d in STANDARD_DIMENSIONS
        )

        prompt = f"""You are an expert English language assessor. Score this learner's performance.

Scenario: {scenario.get('title', '')}
Context: {scenario.get('context', '')}
Success criteria: {scenario.get('success_criteria', '')}
Goals: {json.dumps(scenario.get('goal_state', []))}

Rubric dimensions (score each 1-5, with brief justification):
{dimension_specs}

Conversation:
{history_text}

Respond with ONLY valid JSON in this exact shape:
{{
  "dimensions": [
    {{"name": "task_completion", "score": 3, "justification": "..."}},
    {{"name": "communicative_appropriateness", "score": 4, "justification": "..."}},
    {{"name": "fluency", "score": 3, "justification": "..."}},
    {{"name": "vocabulary_range", "score": 3, "justification": "..."}}
  ]
}}"""

        try:
            response = self._get_client().messages.create(
                model=settings.anthropic_model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return self._populate_from_json(data, rubric)
        except Exception:
            pass

        return self._heuristic_evaluate(conversation_history, rubric)

    def _populate_from_json(self, data: dict, rubric: RubricSchema) -> RubricSchema:
        scores_by_name = {
            d["name"]: d for d in data.get("dimensions", []) if "name" in d
        }
        for dim in rubric.dimensions:
            if dim.name in scores_by_name:
                entry = scores_by_name[dim.name]
                dim.score = max(1.0, min(5.0, float(entry.get("score", 3))))
                dim.justification = entry.get("justification", "")
        return rubric

    def _heuristic_evaluate(
        self, history: list[dict], rubric: RubricSchema
    ) -> RubricSchema:
        user_messages = [m for m in history if m.get("role") == "user"]
        word_count = sum(len(m.get("content", "").split()) for m in user_messages)
        turn_count = len(user_messages)

        base = 2.0
        if turn_count >= 3:
            base += 0.5
        if word_count >= 30:
            base += 0.5
        if word_count >= 60:
            base += 0.5
        base = min(5.0, base)

        for dim in rubric.dimensions:
            dim.score = base
            dim.justification = (
                "Heuristic score (no API key): based on participation length and turns."
            )
        return rubric

    @staticmethod
    def _format_history(history: list[dict]) -> str:
        lines = []
        for msg in history:
            role = msg.get("role", "unknown").upper()
            lines.append(f"{role}: {msg.get('content', '')}")
        return "\n".join(lines)
