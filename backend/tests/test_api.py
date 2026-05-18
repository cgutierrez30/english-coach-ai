import pytest
from fastapi.testclient import TestClient

from database import Base, engine, init_db
from main import app


@pytest.fixture
def client():
    Base.metadata.drop_all(bind=engine)
    init_db()
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_list_scenarios(client):
    res = client.get("/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 6
    ids = {s["id"] for s in data}
    assert "order_food" in ids


def test_session_flow(client):
    start = client.post(
        "/sessions",
        json={"scenario_id": "order_food", "display_name": "Test User"},
    )
    assert start.status_code == 200
    session_id = start.json()["session_id"]
    user_id = start.json()["user_id"]

    msg = client.post(
        f"/sessions/{session_id}/message",
        json={"message": "Hi! I would like a coffee and a sandwich, please."},
    )
    assert msg.status_code == 200
    assert "reply" in msg.json()

    end = client.post(f"/sessions/{session_id}/end")
    assert end.status_code == 200
    assert end.json()["status"] == "completed"

    eval_res = client.post(f"/sessions/{session_id}/evaluate")
    assert eval_res.status_code == 200
    assert "overall_score" in eval_res.json()
    assert "feedback" in eval_res.json()

    progress = client.get(f"/progress/{user_id}")
    assert progress.status_code == 200
    assert progress.json()["total_sessions"] >= 1
