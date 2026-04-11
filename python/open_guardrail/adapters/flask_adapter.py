"""Flask adapter for open-guardrail."""
from __future__ import annotations

import json
from typing import Sequence

from open_guardrail.core import Guard, Pipeline


class FlaskGuardrail:
    """Flask extension for guardrailing requests."""

    def __init__(
        self,
        app=None,
        guards: Sequence[Guard] = (),
        on_block: str = "reject",
    ):
        self.pipeline = Pipeline(guards) if guards else None
        self.on_block = on_block
        if app:
            self.init_app(app)

    def init_app(self, app):
        """Register before_request hook with Flask app."""
        app.before_request(self._check_input)

    def _check_input(self):
        from flask import jsonify, request

        if not self.pipeline:
            return None

        text = ""
        if request.is_json:
            text = json.dumps(request.get_json(silent=True) or {})
        elif request.data:
            text = request.data.decode("utf-8", errors="ignore")
        elif request.args:
            text = " ".join(request.args.values())

        if not text:
            return None

        result = self.pipeline.run(text, "input")
        if not result.passed:
            blocked = [r for r in result.results if not r.passed]
            return (
                jsonify({
                    "error": "blocked_by_guardrail",
                    "guard": (
                        blocked[0].guard_name
                        if blocked
                        else "unknown"
                    ),
                    "message": (
                        blocked[0].message
                        if blocked and blocked[0].message
                        else "Blocked"
                    ),
                }),
                403,
            )
        return None
