from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models.evaluation import Evaluation
from models.session import Session
from models.user import User
from scenarios.scenario_registry import get_scenario

router = APIRouter(tags=["progress"])


@router.get("/progress/{user_id}")
def get_progress(user_id: str, db: DbSession = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sessions = (
        db.query(Session)
        .filter(Session.user_id == user_id)
        .order_by(Session.started_at.desc())
        .all()
    )

    session_summaries = []
    scores = []
    scenario_counts: dict[str, int] = {}

    for s in sessions:
        scenario = get_scenario(s.scenario_id)
        evaluation = (
            db.query(Evaluation).filter(Evaluation.session_id == s.id).first()
        )
        score = evaluation.overall_score if evaluation else None
        if score is not None:
            scores.append(score)

        scenario_counts[s.scenario_id] = scenario_counts.get(s.scenario_id, 0) + 1

        session_summaries.append(
            {
                "session_id": s.id,
                "scenario_id": s.scenario_id,
                "scenario_title": scenario["title"] if scenario else s.scenario_id,
                "status": s.status,
                "goals_completed": s.goals_completed,
                "overall_score": score,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            }
        )

    avg_score = round(sum(scores) / len(scores), 2) if scores else None

    return {
        "user_id": user_id,
        "display_name": user.display_name,
        "total_sessions": len(sessions),
        "completed_sessions": sum(1 for s in sessions if s.status == "completed"),
        "evaluated_sessions": len(scores),
        "average_score": avg_score,
        "scenarios_practiced": scenario_counts,
        "sessions": session_summaries,
    }
