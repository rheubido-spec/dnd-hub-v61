from pydantic import BaseModel, Field


class DiceRollRequest(BaseModel):
    sides: int = Field(ge=2, le=1000)
    count: int = Field(default=1, ge=1, le=100)
    modifier: int = Field(default=0, ge=-1000, le=1000)


class DiceRollResponse(BaseModel):
    rolls: list[int]
    modifier: int
    total: int
