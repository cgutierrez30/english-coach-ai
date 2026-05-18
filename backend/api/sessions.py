import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models.session import Session
from models.user import User
from scenarios.controller import ScenarioController
from scenarios.scenario_registry import get_scenario, list_scenarios

router = APIRouter(tags=["sessions"])


class StartSessionRequest(BaseModel):
    scenario_id: str
    user_id: str | None = None
    display_name: str = "Learner"


class MessageRequest(BaseModel):
    message: str


@router.get("/scenarios")
def get_scenarios():
    scenarios = list_scenarios()
    return [
        {
            "id": s["id"],
            "title": s["title"],
            "description": s["description"],
            "difficulty": s["difficulty"],
        }
        for s in scenarios
    ]


@router.post("/sessions")
def start_session(body: StartSessionRequest, db: DbSession = Depends(get_db)):
    scenario = get_scenario(body.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    user_id = body.user_id or str(uuid.uuid4())
    user = db.get(User, user_id)
    if not user:
        user = User(id=user_id, display_name=body.display_name)
        db.add(user)

    session_id = str(uuid.uuid4())
    opening = scenario.get("opening_line", "Hello!")
    history = [{"role": "assistant", "content": opening}]

    session = Session(
        id=session_id,
        user_id=user_id,
        scenario_id=body.scenario_id,
        status="active",
        conversation_history="[]",
    )
    session.set_history(history)
    db.add(session)
    db.commit()

    return {
        "session_id": session_id,
        "user_id": user_id,
        "scenario": {
            "id": scenario["id"],
            "title": scenario["title"],
            "description": scenario["description"],
            "difficulty": scenario["difficulty"],
        },
        "opening_message": opening,
        "conversation": history,
    }


@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: DbSession = Depends(get_db)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _session_response(session, db)


@router.post("/sessions/{session_id}/message")
def send_message(
    session_id: str, body: MessageRequest, db: DbSession = Depends(get_db)
):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    scenario = get_scenario(session.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    history = session.get_history()
    history.append({"role": "user", "content": body.message.strip()})

    controller = ScenarioController(scenario, session_id)
    reply = controller.get_next_response(history)
    history.append({"role": "assistant", "content": reply})

    goals_met = controller.check_goal_completion(history)
    session.set_history(history)
    session.goals_completed = goals_met
    db.commit()

    return {
        "reply": reply,
        "goals_completed": goals_met,
        "conversation": history,
    }


@router.post("/sessions/{session_id}/end")
def end_session(session_id: str, db: DbSession = Depends(get_db)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.ended_at = datetime.utcnow()
    db.commit()

    return _session_response(session, db)


def _session_response(session: Session, db: DbSession):
    scenario = get_scenario(session.scenario_id)
    return {
        "session_id": session.id,
        "user_id": session.user_id,
        "scenario_id": session.scenario_id,
        "scenario_title": scenario["title"] if scenario else session.scenario_id,
        "status": session.status,
        "goals_completed": session.goals_completed,
        "conversation": session.get_history(),
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
    }
