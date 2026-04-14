from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.deps import can_edit_campaign, can_view_campaign, get_current_user, get_party_role
from app.db.session import get_db
from app.models.models import Campaign, User
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate
from app.services.audit import log_party_event

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignRead])
def list_campaigns(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    party_ids = [m.party_id for m in current_user.memberships]
    query = db.query(Campaign).filter(
        or_(
            Campaign.owner_id == current_user.id,
            Campaign.dm_user_id == current_user.id,
            Campaign.party_id.in_(party_ids if party_ids else [-1])
        )
    )
    return query.order_by(Campaign.updated_at.desc()).all()


@router.post("", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.party_id and get_party_role(db, payload.party_id, current_user.id) != "dm":
        raise HTTPException(status_code=403, detail="Only a party DM can create a campaign for that party")
    item = Campaign(owner_id=current_user.id, dm_user_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.flush()
    if item.party_id:
        log_party_event(
            db,
            party_id=item.party_id,
            actor_id=current_user.id,
            action="campaign.created",
            entity_type="campaign",
            entity_id=item.id,
            details={"title": item.title, "status": item.status},
        )
    db.commit()
    db.refresh(item)
    return item


@router.get("/{campaign_id}", response_model=CampaignRead)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not item or not can_view_campaign(db, item, current_user):
        raise HTTPException(status_code=404, detail="Campaign not found")
    return item


@router.put("/{campaign_id}", response_model=CampaignRead)
def update_campaign(campaign_id: int, payload: CampaignUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not item or not can_edit_campaign(db, item, current_user):
        raise HTTPException(status_code=404, detail="Campaign not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("party_id") and get_party_role(db, updates["party_id"], current_user.id) != "dm":
        raise HTTPException(status_code=403, detail="Only a party DM can move a campaign into that party")
    if updates.get("dm_user_id") and item.party_id:
        if get_party_role(db, item.party_id, updates["dm_user_id"]) != "dm":
            raise HTTPException(status_code=400, detail="Selected DM must be a DM in the campaign party")
    old_party_id = item.party_id
    old_title = item.title
    old_status = item.status
    old_dm = item.dm_user_id
    for key, value in updates.items():
        setattr(item, key, value)
    db.add(item)
    target_party_id = item.party_id or old_party_id
    if target_party_id:
        log_party_event(
            db,
            party_id=target_party_id,
            actor_id=current_user.id,
            action="campaign.updated",
            entity_type="campaign",
            entity_id=item.id,
            details={
                "title_before": old_title,
                "title_after": item.title,
                "status_before": old_status,
                "status_after": item.status,
                "dm_user_id_before": old_dm,
                "dm_user_id_after": item.dm_user_id,
                "party_id_before": old_party_id,
                "party_id_after": item.party_id,
            },
        )
    db.commit()
    db.refresh(item)
    return item


@router.post("/{campaign_id}/clone", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def clone_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not item or not can_view_campaign(db, item, current_user):
        raise HTTPException(status_code=404, detail="Campaign not found")

    target_party_id = item.party_id if (item.party_id and get_party_role(db, item.party_id, current_user.id) == "dm") else None

    cloned = Campaign(
        owner_id=current_user.id,
        dm_user_id=current_user.id,
        party_id=target_party_id,
        title=f"{item.title} (Copy)",
        theme=item.theme,
        setting_name=item.setting_name,
        summary=item.summary,
        status="draft",
        campaign_data={
            **(item.campaign_data or {}),
            "cloned_from_campaign_id": item.id,
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
            action="campaign.cloned",
            entity_type="campaign",
            entity_id=cloned.id,
            details={"title": cloned.title, "source_campaign_id": item.id},
        )
    db.commit()
    db.refresh(cloned)
    return cloned


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not item or not can_edit_campaign(db, item, current_user):
        raise HTTPException(status_code=404, detail="Campaign not found")
    party_id = item.party_id
    title = item.title
    campaign_id_value = item.id
    db.delete(item)
    if party_id:
        log_party_event(
            db,
            party_id=party_id,
            actor_id=current_user.id,
            action="campaign.deleted",
            entity_type="campaign",
            entity_id=campaign_id_value,
            details={"title": title},
        )
    db.commit()
