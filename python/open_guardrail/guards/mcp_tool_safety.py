"""Validates MCP (Model Context Protocol) tool calls for safety."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_DENIED_TOOLS = [
    "execute_command",
    "run_shell",
    "write_file",
    "delete_file",
    "send_request",
]

_MCP_PATTERNS = [
    re.compile(r"mcp://", re.IGNORECASE),
    re.compile(r"\bserver:\s*", re.IGNORECASE),
    re.compile(r"\btool:\s*", re.IGNORECASE),
    re.compile(r"\bmcp_call\b", re.IGNORECASE),
    re.compile(r"\buse_mcp_tool\b", re.IGNORECASE),
]

_SERVER_PATTERN = re.compile(r"(?:mcp://|server:\s*)(\S+)", re.IGNORECASE)
_TOOL_PATTERN = re.compile(r"(?:tool:\s*|mcp_call\s+|use_mcp_tool\s+)(\S+)", re.IGNORECASE)


class _McpToolSafetyGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_servers: Optional[List[str]] = None,
        denied_tools: Optional[List[str]] = None,
    ) -> None:
        self.name = "mcp-tool-safety"
        self.action = action
        self.allowed_servers = allowed_servers
        self.denied_tools = denied_tools if denied_tools is not None else _DEFAULT_DENIED_TOOLS

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        has_mcp = any(p.search(text) for p in _MCP_PATTERNS)
        if not has_mcp:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="mcp-tool-safety",
                passed=True,
                action="allow",
                message=None,
                latency_ms=round(elapsed, 2),
                details=None,
            )

        server_match = _SERVER_PATTERN.search(text)
        if self.allowed_servers and server_match:
            server = server_match.group(1)
            if server not in self.allowed_servers:
                issues.append(f"Unauthorized MCP server: {server}")

        tool_match = _TOOL_PATTERN.search(text)
        if tool_match:
            tool = tool_match.group(1)
            if tool in self.denied_tools:
                issues.append(f"Denied MCP tool: {tool}")

        for d in self.denied_tools:
            if d in text and not any(d in i for i in issues):
                issues.append(f"Denied tool reference found: {d}")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="mcp-tool-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={
                "issues": issues,
                "server": server_match.group(1) if server_match else None,
                "tool": tool_match.group(1) if tool_match else None,
            } if triggered else None,
        )


def mcp_tool_safety(
    *,
    action: str = "block",
    allowed_servers: Optional[List[str]] = None,
    denied_tools: Optional[List[str]] = None,
) -> _McpToolSafetyGuard:
    return _McpToolSafetyGuard(
        action=action,
        allowed_servers=allowed_servers,
        denied_tools=denied_tools,
    )
