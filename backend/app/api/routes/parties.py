
from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import String, asc, cast, desc, distinct, func, or_
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, get_party_role
from app.db.session import get_db
from app.models.models import Party, PartyAuditLog, PartyInvite, PartyMembership, User
from app.schemas.party import (
    PartyAuditLogFilterOptions,
    PartyAuditLogPage,
    PartyAuditLogRead,
    PartyCreate,
    PartyInviteCreate,
    PartyInviteRead,
    PartyRead,
    PartyRoleUpdate,
    PartyUpdate,
)
from app.services.audit import log_party_event

router = APIRouter(prefix="/parties", tags=["parties"])

SortField = Literal["created_at", "action", "entity_type", "actor"]
SortDir = Literal["asc", "desc"]


def _require_party_member(db: Session, party_id: int, user_id: int) -> str:
    role = get_party_role(db, party_id, user_id)
    if not role:
        raise HTTPException(status_code=403, detail="You must belong to the selected party")
    return role


def _build_audit_log_query(
    db: Session,
    *,
    party_id: int,
    action: str | None = None,
    entity_type: str | None = None,
    actor_id: int | None = None,
    q: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    query = db.query(PartyAuditLog).options(selectinload(PartyAuditLog.actor)).filter(PartyAuditLog.party_id == party_id)

    if action:
        query = query.filter(PartyAuditLog.action == action)
    if entity_type:
        query = query.filter(PartyAuditLog.entity_type == entity_type)
    if actor_id is not None:
        query = query.filter(PartyAuditLog.actor_id == actor_id)
    if start_date:
        query = query.filter(PartyAuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(PartyAuditLog.created_at <= end_date)
    if q:
        search = f"%{q.strip()}%"
        query = query.outerjoin(User, PartyAuditLog.actor_id == User.id).filter(
            or_(
                PartyAuditLog.action.ilike(search),
                PartyAuditLog.entity_type.ilike(search),
                cast(PartyAuditLog.entity_id, String).ilike(search),
                cast(PartyAuditLog.details, String).ilike(search),
                User.username.ilike(search),
                User.email.ilike(search),
            )
        )
    return query


def _apply_audit_log_sort(query, sort_by: SortField, sort_dir: SortDir):
    direction = asc if sort_dir == "asc" else desc
    if sort_by == "action":
        return query.order_by(direction(PartyAuditLog.action), desc(PartyAuditLog.created_at), desc(PartyAuditLog.id))
    if sort_by == "entity_type":
        return query.order_by(direction(PartyAuditLog.entity_type), desc(PartyAuditLog.created_at), desc(PartyAuditLog.id))
    if sort_by == "actor":
        return query.outerjoin(User, PartyAuditLog.actor_id == User.id).order_by(direction(User.username), desc(PartyAuditLog.created_at), desc(PartyAuditLog.id))
    return query.order_by(direction(PartyAuditLog.created_at), direction(PartyAuditLog.id))


@router.get("", response_model=list[PartyRead])
def list_parties(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Party)
        .join(PartyMembership, PartyMembership.party_id == Party.id)
        .filter(PartyMembership.user_id == current_user.id)
        .options(selectinload(Party.memberships).selectinload(PartyMembership.user))
        .order_by(Party.updated_at.desc())
        .all()
    )


@router.post("", response_model=PartyRead, status_code=status.HTTP_201_CREATED)
def create_party(payload: PartyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    party = Party(owner_id=current_user.id, **payload.model_dump())
    db.add(party)
    db.flush()
    membership = PartyMembership(party_id=party.id, user_id=current_user.id, role="dm")
    db.add(membership)
    log_party_event(db, party_id=party.id, actor_id=current_user.id, action="party.created", entity_type="party", entity_id=party.id, details={"name": party.name, "theme": party.theme})
    db.commit()
    return (
        db.query(Party)
        .options(selectinload(Party.memberships).selectinload(PartyMembership.user))
        .filter(Party.id == party.id)
        .first()
    )


@router.put("/{party_id}", response_model=PartyRead)
def update_party(party_id: int, payload: PartyUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_party_role(db, party_id, current_user.id) != "dm":
        raise HTTPException(status_code=403, detail="Only a DM can update a party")
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    before = {"name": party.name, "description": party.description, "theme": party.theme}
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(party, key, value)
    db.add(party)
    log_party_event(db, party_id=party.id, actor_id=current_user.id, action="party.updated", entity_type="party", entity_id=party.id, details={"before": before, "after": {"name": party.name, "description": party.description, "theme": party.theme}})
    db.commit()
    return (
        db.query(Party)
        .options(selectinload(Party.memberships).selectinload(PartyMembership.user))
        .filter(Party.id == party_id)
        .first()
    )


@router.post("/{party_id}/invites", response_model=PartyInviteRead, status_code=status.HTTP_201_CREATED)
def invite_to_party(party_id: int, payload: PartyInviteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_party_role(db, party_id, current_user.id) != "dm":
        raise HTTPException(status_code=403, detail="Only a DM can invite players")
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing_member = db.query(PartyMembership).filter(PartyMembership.party_id == party_id, PartyMembership.user_id == user.id).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already in the party")
    invite = db.query(PartyInvite).filter(PartyInvite.party_id == party_id, PartyInvite.invitee_user_id == user.id, PartyInvite.status == "pending").first()
    if invite:
        raise HTTPException(status_code=400, detail="Pending invite already exists")
    invite = PartyInvite(party_id=party_id, invitee_user_id=user.id, invited_by_user_id=current_user.id, role=payload.role, status="pending")
    db.add(invite)
    db.flush()
    log_party_event(db, party_id=party_id, actor_id=current_user.id, action="party.invite.sent", entity_type="invite", entity_id=invite.id, details={"invitee_user_id": user.id, "invitee_username": user.username, "role": payload.role})
    db.commit()
    db.refresh(invite)
    return invite


@router.get("/invites", response_model=list[PartyInviteRead])
def list_my_invites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PartyInvite).filter(PartyInvite.invitee_user_id == current_user.id, PartyInvite.status == "pending").order_by(PartyInvite.created_at.desc()).all()


@router.post("/invites/{invite_id}/accept", response_model=PartyRead)
def accept_invite(invite_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invite = db.query(PartyInvite).filter(PartyInvite.id == invite_id, PartyInvite.invitee_user_id == current_user.id, PartyInvite.status == "pending").first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    membership = PartyMembership(party_id=invite.party_id, user_id=current_user.id, role=invite.role)
    db.add(membership)
    invite.status = "accepted"
    db.add(invite)
    log_party_event(db, party_id=invite.party_id, actor_id=current_user.id, action="party.invite.accepted", entity_type="membership", details={"invite_id": invite.id, "user_id": current_user.id, "username": current_user.username, "role": invite.role})
    db.commit()
    return (
        db.query(Party)
        .options(selectinload(Party.memberships).selectinload(PartyMembership.user))
        .filter(Party.id == invite.party_id)
        .first()
    )


@router.post("/{party_id}/members/{user_id}/role", response_model=PartyRead)
def update_member_role(party_id: int, user_id: int, payload: PartyRoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_party_role(db, party_id, current_user.id) != "dm":
        raise HTTPException(status_code=403, detail="Only a DM can change roles")
    membership = db.query(PartyMembership).filter(PartyMembership.party_id == party_id, PartyMembership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    old_role = membership.role
    membership.role = payload.role
    db.add(membership)
    log_party_event(db, party_id=party_id, actor_id=current_user.id, action="party.member.role_updated", entity_type="membership", entity_id=membership.id, details={"user_id": user_id, "from_role": old_role, "to_role": payload.role})
    db.commit()
    return (
        db.query(Party)
        .options(selectinload(Party.memberships).selectinload(PartyMembership.user))
        .filter(Party.id == party_id)
        .first()
    )


@router.delete("/{party_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(party_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_party_role(db, party_id, current_user.id) != "dm" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Only a DM can remove another member")
    membership = db.query(PartyMembership).filter(PartyMembership.party_id == party_id, PartyMembership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    removed = {"user_id": membership.user_id, "role": membership.role}
    db.delete(membership)
    log_party_event(db, party_id=party_id, actor_id=current_user.id, action="party.member.removed", entity_type="membership", details=removed)
    db.commit()


@router.get("/{party_id}/audit-logs/filter-options", response_model=PartyAuditLogFilterOptions)
def audit_log_filter_options(party_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_party_member(db, party_id, current_user.id)
    action_rows = db.query(distinct(PartyAuditLog.action)).filter(PartyAuditLog.party_id == party_id).order_by(PartyAuditLog.action.asc()).all()
    entity_rows = db.query(distinct(PartyAuditLog.entity_type)).filter(PartyAuditLog.party_id == party_id).order_by(PartyAuditLog.entity_type.asc()).all()
    actors = (
        db.query(User)
        .join(PartyAuditLog, PartyAuditLog.actor_id == User.id)
        .filter(PartyAuditLog.party_id == party_id)
        .group_by(User.id)
        .order_by(func.max(PartyAuditLog.created_at).desc())
        .all()
    )
    return PartyAuditLogFilterOptions(actions=[row[0] for row in action_rows if row[0]], entity_types=[row[0] for row in entity_rows if row[0]], actors=actors)


@router.get("/{party_id}/audit-logs", response_model=PartyAuditLogPage)
def list_party_audit_logs(
    party_id: int,
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    actor_id: int | None = Query(default=None),
    q: str | None = Query(default=None, description="Search across action, actor, entity, and details"),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
    sort_by: SortField = Query(default="created_at"),
    sort_dir: SortDir = Query(default="desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_party_member(db, party_id, current_user.id)
    base_query = _build_audit_log_query(db, party_id=party_id, action=action, entity_type=entity_type, actor_id=actor_id, q=q, start_date=start_date, end_date=end_date)
    total = base_query.count()
    items = _apply_audit_log_sort(base_query, sort_by, sort_dir).offset((page - 1) * page_size).limit(page_size).all()
    return PartyAuditLogPage(items=items, total=total, page=page, page_size=page_size, sort_by=sort_by, sort_dir=sort_dir)


@router.get("/{party_id}/audit-logs/export")
def export_party_audit_logs(
    party_id: int,
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    actor_id: int | None = Query(default=None),
    q: str | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    sort_by: SortField = Query(default="created_at"),
    sort_dir: SortDir = Query(default="desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_party_member(db, party_id, current_user.id)
    logs = _apply_audit_log_sort(
        _build_audit_log_query(db, party_id=party_id, action=action, entity_type=entity_type, actor_id=actor_id, q=q, start_date=start_date, end_date=end_date),
        sort_by,
        sort_dir,
    ).limit(10000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "party_id", "created_at", "actor_username", "actor_email", "action", "entity_type", "entity_id", "details"])
    for log in logs:
        writer.writerow([log.id, log.party_id, log.created_at.isoformat() if log.created_at else "", log.actor.username if log.actor else "", log.actor.email if log.actor else "", log.action, log.entity_type, log.entity_id if log.entity_id is not None else "", log.details])
    filename = f"party_{party_id}_audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
