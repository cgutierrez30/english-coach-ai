import pytest

from rubric.evaluator import RubricEvaluator
from rubric.schema import RubricSchema

SAMPLE_SCENARIO = {
    "id": "order_food",
    "title": "Ordering Food",
    "context": "Diner",
    "success_criteria": "Order food",
    "goal_state": ["greet", "order"],
    "rubric_weights": {
        "task_completion": 0.4,
        "communicative_appropriateness": 0.3,
        "fluency": 0.2,
        "vocabulary_range": 0.1,
    },
}


@pytest.fixture
def evaluator():
    return RubricEvaluator()


def test_rubric_schema_overall_score_weighted():
    rubric = RubricSchema.empty(weights=SAMPLE_SCENARIO["rubric_weights"])
    for dim in rubric.dimensions:
        dim.score = 4.0
    assert rubric.overall_score == 4.0


def test_rubric_to_dict_has_four_dimensions():
    rubric = RubricSchema.empty()
    data = rubric.to_dict()
    assert len(data["dimensions"]) == 4
    names = {d["name"] for d in data["dimensions"]}
    assert "task_completion" in names
    assert "vocabulary_range" in names


def test_heuristic_evaluate_without_api_key(evaluator, monkeypatch):
    monkeypatch.setattr("rubric.evaluator.settings.anthropic_api_key", "")
    history = [
        {"role": "user", "content": "Hello, I would like a burger and fries please."},
        {"role": "assistant", "content": "Sure!"},
        {"role": "user", "content": "And a water. Thank you."},
    ]
    result = evaluator.evaluate(history, SAMPLE_SCENARIO)
    assert result.overall_score >= 2.0
    assert all(1 <= d.score <= 5 for d in result.dimensions)
