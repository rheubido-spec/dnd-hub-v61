from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_superuser
from app.db.session import get_db
from app.models.models import ReferenceMaterial, SourceRegistry, User
from app.schemas.reference import (
    ReferenceMaterialPage,
    ReferenceOptionGroup,
    ReferenceOptionsResponse,
    ReferenceSeedResult,
    SourceRegistryRead,
)
from app.services.reference_seed import seed_reference_data

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/links")
def reference_links():
    return {
        "official": [
            {"label": "D&D Beyond Free Rules / How to Play", "url": "https://www.dndbeyond.com/how-to-play-dnd"},
            {"label": "D&D Beyond SRD", "url": "https://www.dndbeyond.com/srd"},
        ],
        "open": [
            {"label": "5e SRD API", "url": "https://www.dnd5eapi.co/"}
        ],
        "review_required": [
            {"label": "5etools", "url": "https://5e.tools/", "note": "Registry-only by default. Bulk import disabled until license/permission is independently verified by the operator."}
        ]
    }


@router.get("/sources", response_model=list[SourceRegistryRead])
def list_sources(db: Session = Depends(get_db)):
    return db.query(SourceRegistry).order_by(SourceRegistry.display_name.asc()).all()


@router.get("/materials", response_model=ReferenceMaterialPage)
def list_materials(
    category: str | None = Query(default=None),
    source_key: str | None = Query(default=None),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(ReferenceMaterial)
    if category:
        query = query.filter(ReferenceMaterial.category == category)
    if source_key:
        query = query.filter(ReferenceMaterial.source_key == source_key)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter((ReferenceMaterial.name.ilike(search)) | (ReferenceMaterial.summary.ilike(search)))

    total = query.count()
    items = (
        query.order_by(ReferenceMaterial.category.asc(), ReferenceMaterial.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return ReferenceMaterialPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/options", response_model=ReferenceOptionsResponse)
def reference_options(
    categories: list[str] = Query(default=[]),
    db: Session = Depends(get_db),
):
    requested = categories or ["race", "class", "subclass", "background", "alignment", "campaign_theme", "campaign_setting", "campaign_mood", "party_focus"]
    labels = {
        "race": "Official SRD lineages",
        "class": "Official SRD classes",
        "subclass": "Official SRD subclasses",
        "background": "Official SRD backgrounds",
        "alignment": "Alignment options",
        "campaign_theme": "Campaign themes",
        "campaign_setting": "Campaign settings",
        "campaign_mood": "Campaign moods",
        "party_focus": "Party focus tags",
    }
    groups: list[ReferenceOptionGroup] = []
    for category in requested:
        items = (
            db.query(ReferenceMaterial)
            .filter(ReferenceMaterial.category == category)
            .order_by(ReferenceMaterial.name.asc())
            .all()
        )
        groups.append(ReferenceOptionGroup(category=category, label=labels.get(category, category.title()), items=items))
    return ReferenceOptionsResponse(groups=groups)


@router.post("/seed-open-content", response_model=ReferenceSeedResult)
def seed_open_content(db: Session = Depends(get_db), _current_user: User = Depends(get_current_superuser)):
    source_count, material_count = seed_reference_data(db)
    return ReferenceSeedResult(source_count=source_count, material_count=material_count)
