
from datetime import datetime
from pydantic import BaseModel, Field


class EncounterTrackerStateBase(BaseModel):
    title: str = "Encounter Tracker"
    tracker_data: dict = Field(default_factory=dict)


class EncounterTrackerStateCreate(EncounterTrackerStateBase):
    pass


class EncounterTrackerStateUpdate(BaseModel):
    title: str | None = None
    tracker_data: dict | None = None


class EncounterTrackerStateRead(EncounterTrackerStateBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
