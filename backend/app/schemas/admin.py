from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel
from app.schemas.auth import UserRead


class AdminStats(BaseModel):
    users: int
    parties: int
    memberships: int
    characters: int
    campaigns: int
    threads: int
    posts: int
    audit_logs: int
    archived_audit_logs: int = 0
    maintenance_runs: int = 0


class DatabaseOverview(BaseModel):
    stats: AdminStats
    users: list[UserRead]


class MaintenanceCheck(BaseModel):
    key: str
    status: str
    summary: str
    details: dict = {}


class MaintenanceRunRead(BaseModel):
    id: int
    status: str
    summary: str
    checks_run: int
    checks_passed: int
    checks_warned: int
    checks_failed: int
    findings: list[MaintenanceCheck]
    optimization_suggestions: list[str]
    report_markdown: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MaintenanceRunPage(BaseModel):
    items: list[MaintenanceRunRead]
    total: int


class MaintenanceRunTrigger(BaseModel):
    run_e2e_browser: bool = False
    archive_old_audit_logs: bool = False
    archive_days_to_keep: int = 90
