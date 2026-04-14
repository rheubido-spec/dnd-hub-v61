from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_superuser
from app.db.session import get_db
from app.models.models import (
    Campaign,
    Character,
    ForumPost,
    ForumThread,
    MaintenanceAgentRun,
    Party,
    PartyAuditLog,
    PartyAuditLogArchive,
    PartyMembership,
    ReferenceMaterial,
    SourceRegistry,
    User,
)
from app.schemas.admin import DatabaseOverview, MaintenanceRunPage, MaintenanceRunRead, MaintenanceRunTrigger
from app.services.audit import archive_old_party_audit_logs
from app.services.maintenance_agent import run_maintenance_agent
from app.services.reference_seed import seed_reference_data

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/database", response_model=DatabaseOverview)
def database_overview(db: Session = Depends(get_db), _current_user: User = Depends(get_current_superuser)):
    stats = {
        'users': db.query(func.count(User.id)).scalar() or 0,
        'parties': db.query(func.count(Party.id)).scalar() or 0,
        'memberships': db.query(func.count(PartyMembership.id)).scalar() or 0,
        'characters': db.query(func.count(Character.id)).scalar() or 0,
        'campaigns': db.query(func.count(Campaign.id)).scalar() or 0,
        'threads': db.query(func.count(ForumThread.id)).scalar() or 0,
        'posts': db.query(func.count(ForumPost.id)).scalar() or 0,
        'audit_logs': db.query(func.count(PartyAuditLog.id)).scalar() or 0,
        'archived_audit_logs': db.query(func.count(PartyAuditLogArchive.id)).scalar() or 0,
        'maintenance_runs': db.query(func.count(MaintenanceAgentRun.id)).scalar() or 0,
    }
    users = db.query(User).order_by(User.created_at.desc()).limit(25).all()
    return DatabaseOverview(stats=stats, users=users)


@router.post("/audit-logs/archive")
def archive_audit_logs(
    days_to_keep: int = Query(default=90, ge=1, le=3650),
    limit: int = Query(default=5000, ge=1, le=20000),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_superuser),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
    archived = archive_old_party_audit_logs(db, older_than=cutoff, limit=limit)
    return {"archived": archived, "days_to_keep": days_to_keep, "limit": limit}


@router.post("/reference/seed-open-content")
def admin_seed_open_content(db: Session = Depends(get_db), _current_user: User = Depends(get_current_superuser)):
    source_count, material_count = seed_reference_data(db)
    return {"source_count": source_count, "material_count": material_count}


@router.get("/reference/status")
def reference_status(db: Session = Depends(get_db), _current_user: User = Depends(get_current_superuser)):
    return {
        "sources": db.query(func.count(SourceRegistry.id)).scalar() or 0,
        "materials": db.query(func.count(ReferenceMaterial.id)).scalar() or 0,
        "archived_audit_logs": db.query(func.count(PartyAuditLogArchive.id)).scalar() or 0,
    }


@router.post("/maintenance/run", response_model=MaintenanceRunRead)
def trigger_maintenance_run(payload: MaintenanceRunTrigger, db: Session = Depends(get_db), current_user: User = Depends(get_current_superuser)):
    return run_maintenance_agent(
        db,
        run_e2e_browser=payload.run_e2e_browser,
        archive_old_audit_logs_flag=payload.archive_old_audit_logs,
        archive_days_to_keep=payload.archive_days_to_keep,
        created_by_user_id=current_user.id,
    )


@router.get("/maintenance/runs", response_model=MaintenanceRunPage)
def list_maintenance_runs(
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_superuser),
):
    query = db.query(MaintenanceAgentRun).order_by(MaintenanceAgentRun.created_at.desc(), MaintenanceAgentRun.id.desc())
    return MaintenanceRunPage(items=query.limit(limit).all(), total=db.query(func.count(MaintenanceAgentRun.id)).scalar() or 0)
