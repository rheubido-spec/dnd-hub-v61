from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.deps import can_edit_character, can_view_character, get_current_user, get_party_role
from app.db.session import get_db
from app.models.models import Character, User
from app.schemas.character import CharacterCreate, CharacterRead, CharacterUpdate
from app.services.audit import log_party_event

router = APIRouter(prefix="/characters", tags=["characters"])


@router.get("", response_model=list[CharacterRead])
def list_characters(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    party_ids = [m.party_id for m in current_user.memberships]
    query = db.query(Character).filter(
        or_(
            Character.owner_id == current_user.id,
            (Character.shared_with_party.is_(True) & Character.party_id.in_(party_ids if party_ids else [-1]))
        )
    )
    return query.order_by(Character.updated_at.desc()).all()


@router.post("", response_model=CharacterRead, status_code=status.HTTP_201_CREATED)
def create_character(payload: CharacterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.party_id and not get_party_role(db, payload.party_id, current_user.id):
        raise HTTPException(status_code=403, detail="You must belong to the selected party")
    item = Character(owner_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.flush()
    if item.party_id:
        log_party_event(
            db,
            party_id=item.party_id,
            actor_id=current_user.id,
            action="character.created",
            entity_type="character",
            entity_id=item.id,
            details={"name": item.name, "shared_with_party": item.shared_with_party},
        )
    db.commit()
    db.refresh(item)
    return item


@router.get("/{character_id}", response_model=CharacterRead)
def get_character(character_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Character).filter(Character.id == character_id).first()
    if not item or not can_view_character(db, item, current_user):
        raise HTTPException(status_code=404, detail="Character not found")
    return item


@router.put("/{character_id}", response_model=CharacterRead)
def update_character(character_id: int, payload: CharacterUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Character).filter(Character.id == character_id).first()
    if not item or not can_edit_character(db, item, current_user):
        raise HTTPException(status_code=404, detail="Character not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("party_id") and not get_party_role(db, updates["party_id"], current_user.id):
        raise HTTPException(status_code=403, detail="You must belong to the selected party")
    old_party_id = item.party_id
    old_shared = item.shared_with_party
    old_name = item.name
    for key, value in updates.items():
        setattr(item, key, value)
    db.add(item)
    if item.party_id:
        log_party_event(
            db,
            party_id=item.party_id,
            actor_id=current_user.id,
            action="character.updated",
            entity_type="character",
            entity_id=item.id,
            details={
                "name": item.name,
                "previous_name": old_name,
                "shared_with_party_before": old_shared,
                "shared_with_party_after": item.shared_with_party,
                "party_id_before": old_party_id,
                "party_id_after": item.party_id,
            },
        )
    elif old_party_id:
        log_party_event(
            db,
            party_id=old_party_id,
            actor_id=current_user.id,
            action="character.unlinked",
            entity_type="character",
            entity_id=item.id,
            details={"name": item.name},
        )
    db.commit()
    db.refresh(item)
    return item


@router.post("/{character_id}/clone", response_model=CharacterRead, status_code=status.HTTP_201_CREATED)
def clone_character(character_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Character).filter(Character.id == character_id).first()
    if not item or not can_view_character(db, item, current_user):
        raise HTTPException(status_code=404, detail="Character not found")

    target_party_id = item.party_id if (item.party_id and get_party_role(db, item.party_id, current_user.id)) else None
    shared_with_party = item.shared_with_party if target_party_id else False

    cloned = Character(
        owner_id=current_user.id,
        party_id=target_party_id,
        name=f"{item.name} (Copy)",
        lineage=item.lineage,
        char_class=item.char_class,
        background=item.background,
        level=item.level,
        alignment=item.alignment,
        shared_with_party=shared_with_party,
        sheet_data={
            **(item.sheet_data or {}),
            "cloned_from_character_id": item.id,
            "cloned_from_owner_id": item.owner_id,
        },
    )
    db.add(cloned)
    db.flush()
    if cloned.party_id:
        log_party_event(
            db,
            party_id=cloned.party_id,
            actor_id=current_user.id,
            action="character.cloned",
            entity_type="character",
            entity_id=cloned.id,
            details={"name": cloned.name, "source_character_id": item.id},
        )
    db.commit()
    db.refresh(cloned)
    return cloned


@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character(character_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Character).filter(Character.id == character_id).first()
    if not item or not can_edit_character(db, item, current_user):
        raise HTTPException(status_code=404, detail="Character not found")
    party_id = item.party_id
    character_id_value = item.id
    character_name = item.name
    db.delete(item)
    if party_id:
        log_party_event(
            db,
            party_id=party_id,
            actor_id=current_user.id,
            action="character.deleted",
            entity_type="character",
            entity_id=character_id_value,
            details={"name": character_name},
        )
    db.commit()
