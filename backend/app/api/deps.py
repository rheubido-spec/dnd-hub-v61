from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.db.session import get_db
from app.models.models import Campaign, Character, PartyMembership, User

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        subject: str | None = payload.get("sub")
        if subject is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.query(User).filter(User.username == subject).first()
    if not user:
        raise credentials_exception
    return user


def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Superuser access required")
    return current_user


def get_party_role(db: Session, party_id: int | None, user_id: int) -> str | None:
    if not party_id:
        return None
    membership = db.query(PartyMembership).filter(PartyMembership.party_id == party_id, PartyMembership.user_id == user_id).first()
    return membership.role if membership else None


def can_view_character(db: Session, character: Character, user: User) -> bool:
    if character.owner_id == user.id:
        return True
    if character.shared_with_party and character.party_id:
        return get_party_role(db, character.party_id, user.id) in {"dm", "player"}
    return False


def can_edit_character(db: Session, character: Character, user: User) -> bool:
    if character.owner_id == user.id:
        return True
    if character.party_id:
        return get_party_role(db, character.party_id, user.id) == "dm"
    return False


def can_view_campaign(db: Session, campaign: Campaign, user: User) -> bool:
    if campaign.owner_id == user.id or campaign.dm_user_id == user.id:
        return True
    if campaign.party_id:
        return get_party_role(db, campaign.party_id, user.id) in {"dm", "player"}
    return False


def can_edit_campaign(db: Session, campaign: Campaign, user: User) -> bool:
    if campaign.owner_id == user.id or campaign.dm_user_id == user.id:
        return True
    if campaign.party_id:
        return get_party_role(db, campaign.party_id, user.id) == "dm"
    return False
