import json
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    scenario_id: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="active")
    conversation_history: Mapped[str] = mapped_column(Text, default="[]")
    goals_completed: Mapped[bool] = mapped_column(default=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="sessions")
    evaluation: Mapped["Evaluation | None"] = relationship(
        back_populates="session", uselist=False
    )

    def get_history(self) -> list[dict]:
        return json.loads(self.conversation_history or "[]")

    def set_history(self, history: list[dict]) -> None:
        self.conversation_history = json.dumps(history)
