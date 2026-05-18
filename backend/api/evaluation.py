import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models.evaluation import Evaluation
from models.session import Session
from rubric.evaluator import RubricEvaluator
from rubric.feedback import FeedbackGenerator
from scenarios.scenario_registry import get_scenario

router = APIRouter(tags=["evaluation"])


@router.post("/sessions/{session_id}/evaluate")
def evaluate_session(session_id: str, db: DbSession = Depends(get_db)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = (
        db.query(Evaluation).filter(Evaluation.session_id == session_id).first()
    )
    if existing:
        return _evaluation_response(existing)

    scenario = get_scenario(session.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    history = session.get_history()
    if len(history) < 2:
        raise HTTPException(
            status_code=400, detail="Conversation too short to evaluate"
        )

    evaluator = RubricEvaluator()
    rubric = evaluator.evaluate(history, scenario)

    feedback_gen = FeedbackGenerator()
    feedback = feedback_gen.generate_feedback(rubric, history)

    evaluation = Evaluation(
        id=str(uuid.uuid4()),
        session_id=session_id,
        overall_score=rubric.overall_score,
        rubric_json=json.dumps(rubric.to_dict()),
        feedback_json=json.dumps(feedback),
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    return _evaluation_response(evaluation)


@router.get("/sessions/{session_id}/evaluation")
def get_evaluation(session_id: str, db: DbSession = Depends(get_db)):
    evaluation = (
        db.query(Evaluation).filter(Evaluation.session_id == session_id).first()
    )
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return _evaluation_response(evaluation)


def _evaluation_response(evaluation: Evaluation) -> dict:
    return {
        "evaluation_id": evaluation.id,
        "session_id": evaluation.session_id,
        "overall_score": evaluation.overall_score,
        "rubric": evaluation.get_rubric(),
        "feedback": evaluation.get_feedback(),
        "created_at": evaluation.created_at.isoformat() if evaluation.created_at else None,
    }
