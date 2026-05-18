import json
from pathlib import Path

LIBRARY_DIR = Path(__file__).parent / "library"
_scenario_cache: dict[str, dict] | None = None


def _load_all() -> dict[str, dict]:
    global _scenario_cache
    if _scenario_cache is not None:
        return _scenario_cache

    scenarios: dict[str, dict] = {}
    for path in LIBRARY_DIR.glob("*.json"):
        with open(path, encoding="utf-8") as f:
            scenario = json.load(f)
        scenarios[scenario["id"]] = scenario
    _scenario_cache = scenarios
    return scenarios


def list_scenarios() -> list[dict]:
    return list(_load_all().values())


def get_scenario(scenario_id: str) -> dict | None:
    return _load_all().get(scenario_id)


def reload_scenarios() -> None:
    global _scenario_cache
    _scenario_cache = None
    _load_all()
