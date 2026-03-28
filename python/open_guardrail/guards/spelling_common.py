"""Detect common misspellings."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_MISSPELLINGS: dict[str, str] = {
    "accomodate": "accommodate",
    "acommodate": "accommodate",
    "acheive": "achieve",
    "achive": "achieve",
    "agressive": "aggressive",
    "aggresive": "aggressive",
    "apparantly": "apparently",
    "begining": "beginning",
    "beleive": "believe",
    "belive": "believe",
    "calender": "calendar",
    "catagory": "category",
    "collegue": "colleague",
    "comming": "coming",
    "commitee": "committee",
    "comittee": "committee",
    "concious": "conscious",
    "definately": "definitely",
    "definatly": "definitely",
    "definetly": "definitely",
    "dilemna": "dilemma",
    "dissapear": "disappear",
    "dissappear": "disappear",
    "dissapoint": "disappoint",
    "embarass": "embarrass",
    "embarras": "embarrass",
    "enviroment": "environment",
    "existance": "existence",
    "familar": "familiar",
    "foriegn": "foreign",
    "foregin": "foreign",
    "goverment": "government",
    "grammer": "grammar",
    "harrass": "harass",
    "hygene": "hygiene",
    "immediatly": "immediately",
    "independant": "independent",
    "knowlege": "knowledge",
    "liason": "liaison",
    "maintenence": "maintenance",
    "millenium": "millennium",
    "mispell": "misspell",
    "neccessary": "necessary",
    "neccesary": "necessary",
    "necesary": "necessary",
    "noticable": "noticeable",
    "occassion": "occasion",
    "occurence": "occurrence",
    "occurance": "occurrence",
    "parliment": "parliament",
    "persistant": "persistent",
    "posession": "possession",
    "prefered": "preferred",
    "privlege": "privilege",
    "privelege": "privilege",
    "pronounciation": "pronunciation",
    "publically": "publicly",
    "recomend": "recommend",
    "recieve": "receive",
    "refered": "referred",
    "relevent": "relevant",
    "relavent": "relevant",
    "religous": "religious",
    "rythm": "rhythm",
    "seperate": "separate",
    "seperete": "separate",
    "succesful": "successful",
    "successfull": "successful",
    "suprise": "surprise",
    "tendancy": "tendency",
    "therefor": "therefore",
    "threshhold": "threshold",
    "tommorow": "tomorrow",
    "tommorrow": "tomorrow",
    "tounge": "tongue",
    "truely": "truly",
    "unforseen": "unforeseen",
    "unfortunatly": "unfortunately",
    "untill": "until",
    "wierd": "weird",
}


class _SpellingCommon:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_errors: int = 3,
    ) -> None:
        self.name = "spelling-common"
        self.action = action
        self._max_errors = max_errors

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[dict[str, str]] = []
        words = re.findall(r"\b[a-zA-Z]+\b", text)

        for word in words:
            lower = word.lower()
            if lower in _MISSPELLINGS:
                found.append(
                    {
                        "wrong": lower,
                        "correct": _MISSPELLINGS[lower],
                    }
                )

        triggered = len(found) > self._max_errors
        score = (
            min(
                len(found) / (self._max_errors * 2),
                1.0,
            )
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="spelling-common",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Too many spelling errors"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "error_count": len(found),
                "samples": found[:5],
            },
        )


def spelling_common(
    *,
    action: str = "warn",
    max_errors: int = 3,
) -> _SpellingCommon:
    return _SpellingCommon(
        action=action, max_errors=max_errors
    )
