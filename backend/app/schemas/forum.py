from datetime import datetime
from pydantic import BaseModel


class ForumPostCreate(BaseModel):
    body: str


class ForumPostRead(BaseModel):
    id: int
    thread_id: int
    author_id: int
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ForumThreadCreate(BaseModel):
    title: str
    topic: str = "general"
    body: str


class ForumThreadRead(BaseModel):
    id: int
    author_id: int
    title: str
    topic: str
    body: str
    created_at: datetime
    posts: list[ForumPostRead] = []

    model_config = {"from_attributes": True}
