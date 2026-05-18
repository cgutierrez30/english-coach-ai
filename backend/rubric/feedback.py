import json
import re

import anthropic

from config import settings
from rubric.schema import RubricSchema


class FeedbackGenerator:
    """Generates structured post-session feedback from rubric scores."""

    def __init__(self):
        self._client: anthropic.Anthropic | None = None

    def _get_client(self) -> anthropic.Anthropic:
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        return self._client

    def generate_feedback(
        self, rubric: RubricSchema, conversation_history: list[dict]
    ) -> dict:
        if settings.anthropic_configured:
            result = self._llm_feedback(rubric, conversation_history)
            if result:
                return result
        return self._template_feedback(rubric, conversation_history)

    def _llm_feedback(
        self, rubric: RubricSchema, conversation_history: list[dict]
    ) -> dict | None:
        history_text = "\n".join(
            f"{m.get('role', '').upper()}: {m.get('content', '')}"
            for m in conversation_history
        )
        rubric_text = json.dumps(rubric.to_dict(), indent=2)

        prompt = f"""Based on this English conversation practice session and rubric scores, write learner feedback.

Rubric:
{rubric_text}

Conversation:
{history_text}

Respond with ONLY valid JSON:
{{
  "summary": "2-3 sentence overall summary",
  "strengths": ["strength 1", "strength 2"],
  "areas_for_improvement": ["area 1", "area 2"],
  "specific_examples": [
    {{"quote": "learner quote or paraphrase", "comment": "what worked or could improve"}}
  ],
  "next_steps": ["actionable step 1", "actionable step 2"]
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
                return json.loads(match.group())
        except Exception:
            pass
        return None

    def _template_feedback(
        self, rubric: RubricSchema, conversation_history: list[dict]
    ) -> dict:
        sorted_dims = sorted(rubric.dimensions, key=lambda d: d.score, reverse=True)
        strongest = sorted_dims[0] if sorted_dims else None
        weakest = sorted_dims[-1] if sorted_dims else None

        user_lines = [
            m.get("content", "")
            for m in conversation_history
            if m.get("role") == "user" and m.get("content")
        ]
        example_quote = user_lines[0][:120] if user_lines else "your responses"

        strengths = []
        improvements = []
        if strongest and strongest.score >= 3:
            strengths.append(
                f"Strong performance in {strongest.name.replace('_', ' ')} "
                f"(score {strongest.score}/5)."
            )
        if weakest and weakest.score < 4:
            improvements.append(
                f"Focus on improving {weakest.name.replace('_', ' ')} "
                f"(score {weakest.score}/5)."
            )
        if not strengths:
            strengths.append("You completed the conversation and practiced real-world English.")
        if not improvements:
            improvements.append("Try using more varied vocabulary in your next session.")

        return {
            "summary": (
                f"Overall score: {rubric.overall_score}/5. "
                "You engaged in a scenario-based conversation and received rubric-based feedback."
            ),
            "strengths": strengths,
            "areas_for_improvement": improvements,
            "specific_examples": [
                {
                    "quote": example_quote,
                    "comment": "This shows your approach to the task; aim for fuller, more precise phrasing next time.",
                }
            ],
            "next_steps": [
                "Repeat this scenario and try to use two new phrases you did not use before.",
                "Practice the lowest-scoring rubric dimension with a short self-recording.",
            ],
        }
