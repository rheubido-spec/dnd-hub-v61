
from datetime import datetime
from pydantic import BaseModel
from app.schemas.auth import UserRead


class PartyCreate(BaseModel):
    name: str
    description: str = ""
    theme: str = "Classic Fantasy"


class PartyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    theme: str | None = None


class PartyMembershipRead(BaseModel):
    id: int
    user_id: int
    role: str
    user: UserRead

    model_config = {"from_attributes": True}


class PartyInviteCreate(BaseModel):
    username: str
    role: str = "player"


class PartyInviteRead(BaseModel):
    id: int
    party_id: int
    invitee_user_id: int
    invited_by_user_id: int
    role: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PartyAuditLogRead(BaseModel):
    id: int
    party_id: int
    actor_id: int | None
    action: str
    entity_type: str
    entity_id: int | None
    details: dict
    created_at: datetime
    actor: UserRead | None = None

    model_config = {"from_attributes": True}


class PartyAuditLogPage(BaseModel):
    items: list[PartyAuditLogRead]
    total: int
    page: int
    page_size: int
    sort_by: str
    sort_dir: str


class PartyRead(BaseModel):
    id: int
    owner_id: int
    name: str
    description: str
    theme: str
    created_at: datetime
    updated_at: datetime
    memberships: list[PartyMembershipRead] = []

    model_config = {"from_attributes": True}


class PartyRoleUpdate(BaseModel):
    role: str


class PartyAuditLogExportResult(BaseModel):
    filename: str
    row_count: int
    exported_at: datetime


class PartyAuditLogFilterOptions(BaseModel):
    actions: list[str]
    entity_types: list[str]
    actors: list[UserRead]
