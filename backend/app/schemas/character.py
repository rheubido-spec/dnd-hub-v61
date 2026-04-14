from datetime import datetime
from pydantic import BaseModel, Field


class CharacterBase(BaseModel):
    name: str
    lineage: str
    char_class: str
    background: str = "Custom"
    level: int = Field(default=1, ge=1, le=20)
    alignment: str = "Unaligned"
    party_id: int | None = None
    shared_with_party: bool = False
    sheet_data: dict = Field(default_factory=dict)


class CharacterCreate(CharacterBase):
    pass


class CharacterUpdate(BaseModel):
    name: str | None = None
    lineage: str | None = None
    char_class: str | None = None
    background: str | None = None
    level: int | None = Field(default=None, ge=1, le=20)
    alignment: str | None = None
    party_id: int | None = None
    shared_with_party: bool | None = None
    sheet_data: dict | None = None


class CharacterRead(CharacterBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
