from dataclasses import dataclass, field


STANDARD_DIMENSIONS = [
    {
        "name": "task_completion",
        "description": "How well the learner achieved the scenario goals and success criteria.",
    },
    {
        "name": "communicative_appropriateness",
        "description": "Politeness, register, and situational fit of language used.",
    },
    {
        "name": "fluency",
        "description": "Smoothness, coherence, and ease of expression in the exchange.",
    },
    {
        "name": "vocabulary_range",
        "description": "Variety and precision of word choice for the situation.",
    },
]


@dataclass
class RubricDimension:
    name: str
    description: str
    score: float = 0.0
    max_score: float = 5.0
    justification: str = ""


@dataclass
class RubricSchema:
    dimensions: list[RubricDimension] = field(default_factory=list)
    weights: dict[str, float] = field(default_factory=dict)

    @property
    def overall_score(self) -> float:
        if not self.dimensions:
            return 0.0
        total_weight = 0.0
        weighted_sum = 0.0
        for dim in self.dimensions:
            weight = self.weights.get(dim.name, 1.0 / len(self.dimensions))
            total_weight += weight
            weighted_sum += dim.score * weight
        if total_weight == 0:
            return sum(d.score for d in self.dimensions) / len(self.dimensions)
        return round(weighted_sum / total_weight, 2)

    def to_dict(self) -> dict:
        return {
            "dimensions": [
                {
                    "name": d.name,
                    "description": d.description,
                    "score": d.score,
                    "max_score": d.max_score,
                    "justification": d.justification,
                }
                for d in self.dimensions
            ],
            "overall_score": self.overall_score,
            "weights": self.weights,
        }

    @classmethod
    def empty(cls, weights: dict[str, float] | None = None) -> "RubricSchema":
        w = weights or {d["name"]: 0.25 for d in STANDARD_DIMENSIONS}
        dimensions = [
            RubricDimension(name=d["name"], description=d["description"])
            for d in STANDARD_DIMENSIONS
        ]
        return cls(dimensions=dimensions, weights=w)
