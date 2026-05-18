import pytest

from scenarios.controller import ScenarioController

SAMPLE_SCENARIO = {
    "id": "order_food",
    "title": "Ordering Food",
    "context": "You are at a diner.",
    "opening_line": "Hi! What can I get you?",
    "goal_state": [
        "user has greeted the server",
        "user has ordered a main dish",
    ],
    "success_criteria": "Complete a restaurant order",
    "difficulty": "beginner",
}


@pytest.fixture
def controller():
    return ScenarioController(SAMPLE_SCENARIO, session_id="test-session-1")


def test_get_system_prompt_includes_scenario_details(controller):
    prompt = controller.get_system_prompt()
    assert "Ordering Food" in prompt
    assert "diner" in prompt.lower()
    assert "user has greeted the server" in prompt


def test_opening_line_when_history_empty(controller):
    response = controller.get_next_response([])
    assert response == "Hi! What can I get you?"


def test_heuristic_goal_check_insufficient_history(controller):
    history = [{"role": "user", "content": "Hi"}]
    assert controller.check_goal_completion(history) is False


def test_heuristic_goal_check_longer_conversation(controller):
    history = [
        {"role": "assistant", "content": "Welcome!"},
        {"role": "user", "content": "Hello, I would like to order a burger please."},
        {"role": "assistant", "content": "Sure, any drink?"},
        {"role": "user", "content": "Yes, a water please. That is all."},
        {"role": "assistant", "content": "Coming right up!"},
        {"role": "user", "content": "Thank you very much for your help today."},
    ]
    assert controller.check_goal_completion(history) is True


def test_fallback_response_without_api_key(controller, monkeypatch):
    monkeypatch.setattr("scenarios.controller.settings.anthropic_api_key", "")
    history = [{"role": "user", "content": "Hello"}]
    response = controller.get_next_response(history)
    assert len(response) > 0
