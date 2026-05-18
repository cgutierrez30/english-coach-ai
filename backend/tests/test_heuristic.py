import pytest

from rubric.evaluator import RubricEvaluator
from rubric.heuristic import analyze_transcript, score_all_dimensions

ORDER_FOOD = {
    "id": "order_food",
    "title": "Ordering Food",
    "goal_state": [
        "user has greeted the server",
        "user has ordered a main dish",
        "user has asked about or ordered a drink",
    ],
}


def test_heuristic_produces_varied_scores():
    rich_history = [
        {"role": "assistant", "content": "Welcome!"},
        {
            "role": "user",
            "content": "Hello! Good afternoon. Could I please order the grilled chicken and a glass of water? Thank you.",
        },
        {"role": "assistant", "content": "Any sides?"},
        {
            "role": "user",
            "content": "Yes, I'd like the garden salad as well. That would be wonderful, thanks so much.",
        },
    ]
    minimal_history = [
        {"role": "user", "content": "burger"},
    ]

    rich_scores = score_all_dimensions(rich_history, ORDER_FOOD)
    minimal_scores = score_all_dimensions(minimal_history, ORDER_FOOD)

    rich_values = [s[0] for s in rich_scores.values()]
    minimal_values = [s[0] for s in minimal_scores.values()]

    assert max(rich_values) > min(rich_values)
    assert sum(rich_values) > sum(minimal_values)
    assert rich_scores["task_completion"][0] >= minimal_scores["task_completion"][0]


def test_heuristic_justifications_are_specific():
    history = [
        {"role": "user", "content": "Hi, please may I have a coffee? Thank you."},
    ]
    scores = score_all_dimensions(history, ORDER_FOOD)
    for name, (score, justification) in scores.items():
        assert 1 <= score <= 5
        assert "heuristic" not in justification.lower()
        assert len(justification) > 20, f"{name} justification too short"


def test_evaluator_heuristic_mode(monkeypatch):
    monkeypatch.setattr("rubric.evaluator.settings.anthropic_api_key", "your_key_here")
    evaluator = RubricEvaluator()
    history = [
        {"role": "user", "content": "Hello! I would like to order pasta and wine please. Thank you!"},
        {"role": "assistant", "content": "Sure."},
        {"role": "user", "content": "That is all for today. Goodbye and thanks again."},
    ]
    rubric = evaluator.evaluate(history, ORDER_FOOD)
    scores = [d.score for d in rubric.dimensions]
    assert len(set(scores)) >= 1
    assert rubric.overall_score >= 1
