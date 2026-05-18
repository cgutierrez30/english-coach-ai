"""Transcript-based rubric scoring when no LLM API key is available."""

import re
from dataclasses import dataclass

POLITE_PHRASES = [
    "please",
    "thank you",
    "thanks",
    "excuse me",
    "sorry",
    "pardon",
    "could you",
    "would you",
    "may i",
    "i'd like",
    "good morning",
    "good afternoon",
    "good evening",
    "hello",
    "hi there",
]

FILLER_PATTERN = re.compile(
    r"\b(um+|uh+|er+|ah+|like|you know|i mean|sort of|kind of)\b",
    re.IGNORECASE,
)

GOAL_SYNONYMS: dict[str, list[str]] = {
    "greet": ["hello", "hi", "hey", "good morning", "good afternoon", "greetings"],
    "greeted": ["hello", "hi", "hey", "good morning", "good afternoon"],
    "order": ["order", "like", "want", "get", "have", "burger", "coffee", "meal", "dish"],
    "ordered": ["order", "like", "want", "get", "burger", "coffee", "meal"],
    "drink": ["drink", "water", "coffee", "tea", "soda", "juice", "beer", "wine"],
    "absence": ["absent", "sick", "not coming", "won't be", "will not be", "day off"],
    "appointment": ["appointment", "schedule", "book", "visit", "checkup", "see the doctor"],
    "schedule": ["schedule", "book", "appointment", "available", "time slot", "date"],
    "name": ["name is", "my name", "i'm", "i am", "this is"],
    "reason": ["because", "reason", "for a", "need to", "calling about"],
    "politely": ["please", "thank", "thanks", "appreciate"],
    "closed": ["goodbye", "bye", "thank you", "have a good", "talk soon"],
    "rent": ["rent", "lease", "monthly", "deposit", "utilities"],
    "apartment": ["apartment", "unit", "bedroom", "lease", "move in", "available"],
    "account": ["account", "balance", "deposit", "withdraw", "transfer", "checking", "savings"],
    "bank": ["account", "deposit", "withdraw", "balance", "transfer"],
    "hotel": ["check in", "check-in", "reservation", "room", "booking", "stay"],
    "reservation": ["reservation", "booking", "confirmed", "under the name"],
    "clarifying": ["what do you mean", "could you repeat", "do you have", "which", "how much"],
}

STOP_WORDS = {
    "user",
    "has",
    "have",
    "had",
    "the",
    "a",
    "an",
    "at",
    "to",
    "and",
    "or",
    "about",
    "one",
    "from",
    "with",
    "for",
    "least",
    "before",
    "when",
    "that",
    "their",
    "they",
    "been",
    "into",
    "during",
    "after",
    "ending",
    "call",
    "handled",
    "asked",
    "stated",
    "provided",
    "described",
    "discussed",
    "confirmed",
    "understanding",
    "steps",
    "next",
    "main",
    "school",
    "server",
    "visit",
    "preference",
    "date",
    "time",
}


@dataclass
class TranscriptAnalysis:
    user_text: str
    user_messages: list[str]
    word_count: int
    unique_words: int
    polite_hits: list[str]
    filler_count: int
    avg_words_per_turn: float
    goals_met: int
    goals_total: int
    goal_details: list[str]


def _user_messages(history: list[dict]) -> list[str]:
    return [m.get("content", "").strip() for m in history if m.get("role") == "user"]


def _words(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def analyze_transcript(history: list[dict], scenario: dict) -> TranscriptAnalysis:
    messages = _user_messages(history)
    user_text = " ".join(messages).lower()
    all_words = _words(user_text)
    unique = set(all_words)

    polite_hits = [p for p in POLITE_PHRASES if p in user_text]
    filler_count = len(FILLER_PATTERN.findall(user_text))
    avg_words = sum(len(_words(m)) for m in messages) / max(len(messages), 1)

    goals = scenario.get("goal_state", [])
    goal_details = []
    goals_met = 0
    for goal in goals:
        met, detail = _check_goal(goal, user_text)
        goal_details.append(detail)
        if met:
            goals_met += 1

    return TranscriptAnalysis(
        user_text=user_text,
        user_messages=messages,
        word_count=len(all_words),
        unique_words=len(unique),
        polite_hits=polite_hits,
        filler_count=filler_count,
        avg_words_per_turn=avg_words,
        goals_met=goals_met,
        goals_total=max(len(goals), 1),
        goal_details=goal_details,
    )


def _check_goal(goal: str, user_text: str) -> tuple[bool, str]:
    tokens = [t for t in re.findall(r"[a-z]+", goal.lower()) if t not in STOP_WORDS and len(t) > 2]
    matched = []
    for token in tokens:
        synonyms = GOAL_SYNONYMS.get(token, [token])
        if any(s in user_text for s in synonyms):
            matched.append(token)
    if matched:
        return True, f"Met: {goal[:50]}… (matched: {', '.join(matched[:3])})"
    return False, f"Partial: {goal[:50]}… (keep working on this)"


def _to_score(ratio: float) -> float:
    return max(1.0, min(5.0, round(1 + ratio * 4)))


def score_vocabulary(analysis: TranscriptAnalysis) -> tuple[float, str]:
    if analysis.word_count == 0:
        return 1.0, "No learner speech detected to assess vocabulary."

    diversity = analysis.unique_words / max(analysis.word_count, 1)
    ratio = 0.0
    if analysis.unique_words >= 8:
        ratio += 0.35
    if analysis.unique_words >= 15:
        ratio += 0.25
    if diversity >= 0.55:
        ratio += 0.25
    if analysis.word_count >= 25:
        ratio += 0.15

    score = _to_score(min(1.0, ratio))
    return score, (
        f"You used {analysis.unique_words} unique words across {analysis.word_count} total words "
        f"(diversity {diversity:.0%}). "
        + (
            "Good variety for this session length."
            if score >= 4
            else "Try introducing more varied nouns and verbs in your next attempt."
        )
    )


def score_politeness(analysis: TranscriptAnalysis) -> tuple[float, str]:
    if not analysis.user_messages:
        return 1.0, "No learner messages to assess tone and politeness."

    hits = analysis.polite_hits
    ratio = min(1.0, len(set(hits)) * 0.22 + (0.15 if "thank" in analysis.user_text else 0))
    if len(analysis.user_messages) >= 2 and "please" in analysis.user_text:
        ratio = min(1.0, ratio + 0.2)

    score = _to_score(ratio)
    found = ", ".join(sorted(set(hits))[:4]) or "none"
    return score, (
        f"Polite phrases detected: {found}. "
        + (
            "Your register fits the situation well."
            if score >= 4
            else "Add please/thank you and clear greetings to sound more natural."
        )
    )


def score_task_completion(analysis: TranscriptAnalysis, scenario: dict) -> tuple[float, str]:
    if analysis.goals_total == 0:
        return 3.0, "Based on your conversation."

    ratio = analysis.goals_met / analysis.goals_total
    if analysis.word_count < 5:
        ratio *= 0.5

    score = _to_score(ratio)
    met = analysis.goals_met
    total = analysis.goals_total
    return score, (
        f"You addressed {met} of {total} scenario goals based on what you said. "
        + (
            analysis.goal_details[0]
            if analysis.goal_details
            else "Keep pushing toward the scenario success criteria."
        )
    )


def score_fluency(analysis: TranscriptAnalysis) -> tuple[float, str]:
    if not analysis.user_messages:
        return 1.0, "No speech to assess fluency."

    ratio = 0.35
    avg = analysis.avg_words_per_turn
    if avg >= 5:
        ratio += 0.25
    if avg >= 8:
        ratio += 0.15
    if len(analysis.user_messages) >= 3:
        ratio += 0.15

    filler_penalty = min(0.4, analysis.filler_count * 0.1)
    ratio = max(0.0, ratio - filler_penalty)

    short_turns = sum(1 for m in analysis.user_messages if len(_words(m)) < 3)
    if short_turns > len(analysis.user_messages) // 2:
        ratio -= 0.15

    score = _to_score(max(0.0, min(1.0, ratio)))
    filler_note = (
        f" Noted {analysis.filler_count} filler word(s)—pausing is fine, but try full sentences."
        if analysis.filler_count
        else " Responses flowed in complete phrases."
    )
    return score, (
        f"Average {avg:.1f} words per turn across {len(analysis.user_messages)} message(s).{filler_note}"
    )


def score_all_dimensions(
    history: list[dict], scenario: dict
) -> dict[str, tuple[float, str]]:
    analysis = analyze_transcript(history, scenario)
    return {
        "task_completion": score_task_completion(analysis, scenario),
        "communicative_appropriateness": score_politeness(analysis),
        "fluency": score_fluency(analysis),
        "vocabulary_range": score_vocabulary(analysis),
    }
