from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import EncounterTrackerState, User
from app.schemas.tracker import (
    EncounterTrackerStateCreate,
    EncounterTrackerStateRead,
    EncounterTrackerStateUpdate,
)

router = APIRouter(prefix="/tracker", tags=["tracker"])


@router.get("", response_model=list[EncounterTrackerStateRead])
def list_tracker_states(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(EncounterTrackerState)
        .filter(EncounterTrackerState.owner_id == current_user.id)
        .order_by(EncounterTrackerState.updated_at.desc())
        .all()
    )


@router.post("", response_model=EncounterTrackerStateRead, status_code=status.HTTP_201_CREATED)
def create_tracker_state(
    payload: EncounterTrackerStateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = EncounterTrackerState(owner_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{tracker_id}", response_model=EncounterTrackerStateRead)
def update_tracker_state(
    tracker_id: int,
    payload: EncounterTrackerStateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(EncounterTrackerState)
        .filter(
            EncounterTrackerState.id == tracker_id,
            EncounterTrackerState.owner_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Tracker state not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{tracker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tracker_state(
    tracker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(EncounterTrackerState)
        .filter(
            EncounterTrackerState.id == tracker_id,
            EncounterTrackerState.owner_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Tracker state not found")

    db.delete(item)
    db.commit()
