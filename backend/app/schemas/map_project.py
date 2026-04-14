
from datetime import datetime
from pydantic import BaseModel, Field


class MapProjectBase(BaseModel):
    name: str
    summary: str = ""
    map_data: dict = Field(default_factory=dict)


class MapProjectCreate(MapProjectBase):
    pass


class MapProjectUpdate(BaseModel):
    name: str | None = None
    summary: str | None = None
    map_data: dict | None = None


class MapProjectRead(MapProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
