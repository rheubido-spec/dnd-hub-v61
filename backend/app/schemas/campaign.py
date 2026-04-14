from datetime import datetime
from pydantic import BaseModel, Field


class CampaignBase(BaseModel):
    title: str
    theme: str = "High Fantasy"
    setting_name: str = "Homebrew Realm"
    summary: str = ""
    status: str = "draft"
    party_id: int | None = None
    campaign_data: dict = Field(default_factory=dict)


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    title: str | None = None
    theme: str | None = None
    setting_name: str | None = None
    summary: str | None = None
    status: str | None = None
    party_id: int | None = None
    dm_user_id: int | None = None
    campaign_data: dict | None = None


class CampaignRead(CampaignBase):
    id: int
    owner_id: int
    dm_user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
