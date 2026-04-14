from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import (
    Campaign,
    Character,
    MaintenanceAgentRun,
    Party,
    PartyAuditLog,
    PartyAuditLogArchive,
    PartyInvite,
    PartyMembership,
    ReferenceMaterial,
    SourceRegistry,
    User,
)
from app.schemas.admin import MaintenanceCheck
from app.services.audit import archive_old_party_audit_logs


def _check_user_health(db: Session) -> MaintenanceCheck:
    total = db.query(func.count(User.id)).scalar() or 0
    inactive = db.query(func.count(User.id)).filter(User.is_active.is_(False)).scalar() or 0
    status = 'pass' if total > 0 else 'warn'
    summary = 'User accounts available for login and collaboration.' if total > 0 else 'No users registered yet.'
    return MaintenanceCheck(key='users', status=status, summary=summary, details={'total_users': total, 'inactive_users': inactive})


def _check_party_integrity(db: Session) -> MaintenanceCheck:
    parties = db.query(Party).all()
    missing_dm = []
    empty_parties = []
    for party in parties:
        roles = [membership.role for membership in party.memberships]
        if 'dm' not in roles:
            missing_dm.append(party.id)
        if not party.memberships:
            empty_parties.append(party.id)
    if missing_dm:
        return MaintenanceCheck(
            key='party_integrity',
            status='fail',
            summary='One or more parties do not currently have a DM membership.',
            details={'parties_missing_dm': missing_dm, 'empty_parties': empty_parties},
        )
    if empty_parties:
        return MaintenanceCheck(
            key='party_integrity',
            status='warn',
            summary='One or more parties exist without any memberships.',
            details={'empty_parties': empty_parties},
        )
    return MaintenanceCheck(
        key='party_integrity',
        status='pass',
        summary='Every party has at least one DM and active membership.',
        details={'party_count': len(parties)},
    )


def _check_content_links(db: Session) -> MaintenanceCheck:
    broken_chars = (
        db.query(func.count(Character.id))
        .filter(Character.shared_with_party.is_(True), Character.party_id.is_(None))
        .scalar()
        or 0
    )
    broken_campaigns = (
        db.query(func.count(Campaign.id))
        .filter(Campaign.party_id.is_not(None))
        .outerjoin(Party, Campaign.party_id == Party.id)
        .filter(Party.id.is_(None))
        .scalar()
        or 0
    )
    if broken_chars or broken_campaigns:
        return MaintenanceCheck(
            key='content_links',
            status='fail',
            summary='Shared content contains broken party relationships.',
            details={'shared_characters_without_party': broken_chars, 'campaigns_with_missing_party': broken_campaigns},
        )
    return MaintenanceCheck(
        key='content_links',
        status='pass',
        summary='Shared characters and campaigns point to valid party records.',
        details={},
    )


def _check_audit_coverage(db: Session) -> MaintenanceCheck:
    party_count = db.query(func.count(Party.id)).scalar() or 0
    audit_count = db.query(func.count(PartyAuditLog.id)).scalar() or 0
    archived_count = db.query(func.count(PartyAuditLogArchive.id)).scalar() or 0
    status = 'pass' if party_count == 0 or audit_count > 0 or archived_count > 0 else 'warn'
    summary = 'Audit events are being recorded.' if status == 'pass' else 'No party audit logs found yet.'
    return MaintenanceCheck(
        key='audit_coverage',
        status=status,
        summary=summary,
        details={'active_audit_logs': audit_count, 'archived_audit_logs': archived_count},
    )


def _check_reference_catalog(db: Session) -> MaintenanceCheck:
    sources = db.query(func.count(SourceRegistry.id)).scalar() or 0
    materials = db.query(func.count(ReferenceMaterial.id)).scalar() or 0
    status = 'pass' if sources > 0 and materials > 0 else 'warn'
    summary = 'Open-content reference catalog is available.' if status == 'pass' else 'Reference catalog is present but needs more verified open content.'
    return MaintenanceCheck(
        key='reference_catalog',
        status=status,
        summary=summary,
        details={'sources': sources, 'materials': materials},
    )


def _check_invite_backlog(db: Session) -> MaintenanceCheck:
    stale_cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    stale = (
        db.query(func.count(PartyInvite.id))
        .filter(PartyInvite.status == 'pending', PartyInvite.created_at < stale_cutoff)
        .scalar()
        or 0
    )
    status = 'pass' if stale == 0 else 'warn'
    summary = 'Pending invites are current.' if stale == 0 else 'There are older pending party invites that may need cleanup.'
    return MaintenanceCheck(
        key='invite_backlog',
        status=status,
        summary=summary,
        details={'stale_pending_invites': stale},
    )


def _build_suggestions(checks: list[MaintenanceCheck]) -> list[str]:
    suggestions: list[str] = []
    lookup = {check.key: check for check in checks}
    if lookup['party_integrity'].status != 'pass':
        suggestions.append('Restore or assign at least one DM membership in every party before enabling more collaboration features.')
    if lookup['content_links'].status != 'pass':
        suggestions.append('Repair broken party relationships for shared characters and campaigns to prevent permission errors in the UI.')
    if lookup['reference_catalog'].status != 'pass':
        suggestions.append('Seed more verified open-content 5e records so the reference browser feels complete for classes, species, and backgrounds.')
    if lookup['invite_backlog'].status != 'pass':
        suggestions.append('Add invite expiration prompts or a cleanup button on the party page to reduce stale collaboration requests.')
    suggestions.append('Run the Playwright smoke suite before release to confirm login, party management, audit logs, and references still work end to end.')
    suggestions.append('Prefer paginated API queries for large lists to keep the mobile experience responsive as shared data grows.')
    return suggestions


def _build_report(checks: list[MaintenanceCheck], suggestions: list[str], archived: int) -> str:
    lines = ['# Maintenance Agent Report', '']
    if archived:
        lines.append(f'- Archived **{archived}** older audit log rows during this run.')
        lines.append('')
    for check in checks:
        lines.append(f"## {check.key.replace('_', ' ').title()}")
        lines.append(f"- Status: **{check.status.upper()}**")
        lines.append(f"- Summary: {check.summary}")
        if check.details:
            for key, value in check.details.items():
                lines.append(f"- {key.replace('_', ' ')}: {value}")
        lines.append('')
    lines.append('## Optimization Suggestions')
    for suggestion in suggestions:
        lines.append(f'- {suggestion}')
    lines.append('')
    lines.append('## End-to-End Coverage')
    lines.append('- API smoke tests are included in `backend/tests/test_smoke.py`.')
    lines.append('- Browser smoke coverage is scaffolded in `frontend/tests/e2e/smoke.spec.ts`.')
    lines.append('- Run `python tools/maintenance_agent.py --with-playwright` from the project root to execute the full local maintenance workflow.')
    return '\n'.join(lines)


def run_maintenance_agent(
    db: Session,
    *,
    run_e2e_browser: bool = False,
    archive_old_audit_logs_flag: bool = False,
    archive_days_to_keep: int = 90,
    created_by_user_id: int | None = None,
) -> MaintenanceAgentRun:
    archived = 0
    if archive_old_audit_logs_flag:
        cutoff = datetime.now(timezone.utc) - timedelta(days=archive_days_to_keep)
        archived = archive_old_party_audit_logs(db, older_than=cutoff, limit=5000)

    checks = [
        _check_user_health(db),
        _check_party_integrity(db),
        _check_content_links(db),
        _check_audit_coverage(db),
        _check_reference_catalog(db),
        _check_invite_backlog(db),
    ]

    suggestions = _build_suggestions(checks)
    status = 'pass'
    if any(check.status == 'fail' for check in checks):
        status = 'fail'
    elif any(check.status == 'warn' for check in checks):
        status = 'warn'
    if run_e2e_browser:
        suggestions.append('This run requested browser E2E validation. Execute the Playwright suite from the local CLI or CI runner where browsers are available.')

    checks_passed = sum(1 for check in checks if check.status == 'pass')
    checks_warned = sum(1 for check in checks if check.status == 'warn')
    checks_failed = sum(1 for check in checks if check.status == 'fail')
    summary = f'{checks_passed} passed, {checks_warned} warned, {checks_failed} failed.'
    run = MaintenanceAgentRun(
        created_by_user_id=created_by_user_id,
        status=status,
        summary=summary,
        checks_run=len(checks),
        checks_passed=checks_passed,
        checks_warned=checks_warned,
        checks_failed=checks_failed,
        findings=[check.model_dump() for check in checks],
        optimization_suggestions=suggestions,
        report_markdown=_build_report(checks, suggestions, archived),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
