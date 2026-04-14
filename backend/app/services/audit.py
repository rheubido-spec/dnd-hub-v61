
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session
from app.models.models import PartyAuditLog, PartyAuditLogArchive


def log_party_event(
    db: Session,
    *,
    party_id: int,
    action: str,
    entity_type: str,
    actor_id: int | None = None,
    entity_id: int | None = None,
    details: dict | None = None,
) -> PartyAuditLog:
    log = PartyAuditLog(
        party_id=party_id,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
    )
    db.add(log)
    db.flush()
    return log


def archive_old_party_audit_logs(db: Session, *, older_than: datetime, limit: int = 5000) -> int:
    logs = (
        db.query(PartyAuditLog)
        .filter(PartyAuditLog.created_at < older_than)
        .order_by(PartyAuditLog.created_at.asc(), PartyAuditLog.id.asc())
        .limit(limit)
        .all()
    )
    count = 0
    for log in logs:
        archive_row = PartyAuditLogArchive(
            original_log_id=log.id,
            party_id=log.party_id,
            actor_id=log.actor_id,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            details=log.details,
            created_at=log.created_at,
        )
        db.add(archive_row)
        db.delete(log)
        count += 1
    db.commit()
    return count
