
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import MapProject, User
from app.schemas.map_project import MapProjectCreate, MapProjectRead, MapProjectUpdate

router = APIRouter(prefix="/maps", tags=["maps"])


@router.get("", response_model=list[MapProjectRead])
def list_maps(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(MapProject)
        .filter(MapProject.owner_id == current_user.id)
        .order_by(MapProject.updated_at.desc())
        .all()
    )


@router.post("", response_model=MapProjectRead, status_code=status.HTTP_201_CREATED)
def create_map(payload: MapProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = MapProject(owner_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{map_id}", response_model=MapProjectRead)
def update_map(map_id: int, payload: MapProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(MapProject).filter(MapProject.id == map_id, MapProject.owner_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Map project not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_map(map_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(MapProject).filter(MapProject.id == map_id, MapProject.owner_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Map project not found")
    db.delete(item)
    db.commit()
