import json
import re

import anthropic

from config import settings
from rubric.heuristic import analyze_transcript
from rubric.schema import RubricSchema

DIMENSION_LABELS = {
    "task_completion": "task completion",
    "communicative_appropriateness": "communicative tone",
    "fluency": "fluency",
    "vocabulary_range": "vocabulary",
}


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
        analysis = analyze_transcript(
            conversation_history,
            {"goal_state": []},
        )

        strengths = []
        improvements = []
        if strongest and strongest.score >= 3.5:
            label = DIMENSION_LABELS.get(strongest.name, strongest.name)
            strengths.append(
                f"Strongest area: {label} ({strongest.score}/5). {strongest.justification}"
            )
        if weakest and weakest.score < strongest.score if strongest else True:
            label = DIMENSION_LABELS.get(weakest.name, weakest.name)
            improvements.append(
                f"Focus next on {label} ({weakest.score}/5). {weakest.justification}"
            )
        if analysis.polite_hits:
            strengths.append(
                f"You used polite language ({', '.join(sorted(set(analysis.polite_hits))[:3])})."
            )
        if analysis.filler_count > 2:
            improvements.append(
                f"Try reducing filler words — we counted about {analysis.filler_count} in your speech."
            )
        if not strengths:
            strengths.append("You completed a full practice conversation in English.")
        if not improvements:
            improvements.append("Push for longer, more detailed responses next session.")

        return {
            "summary": (
                f"You scored {rubric.overall_score}/5 overall. "
                f"Scores were calculated from your transcript: "
                f"vocabulary diversity, politeness, goal coverage, and fluency."
            ),
            "strengths": strengths[:3],
            "areas_for_improvement": improvements[:3],
            "specific_examples": [
                {
                    "quote": example_quote,
                    "comment": "This line represents your speaking style in this session — build on what worked here.",
                }
            ],
            "next_steps": [
                f"Practice again and aim to raise your lowest dimension ({DIMENSION_LABELS.get(weakest.name, 'weak area') if weakest else 'fluency'}).",
                "Prepare two new phrases for the scenario before you start the next session.",
            ],
        }
