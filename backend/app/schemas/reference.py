from datetime import datetime
from pydantic import BaseModel


class SourceRegistryRead(BaseModel):
    id: int
    source_key: str
    display_name: str
    base_url: str
    license_name: str
    trust_level: str
    is_official: bool
    is_open_content: bool
    is_import_enabled: bool
    import_notes: str
    source_metadata: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReferenceMaterialRead(BaseModel):
    id: int
    source_key: str
    source_name: str
    license_name: str
    source_url: str
    category: str
    name: str
    slug: str
    edition: str
    summary: str
    tags: list
    content: dict
    is_open_content: bool
    is_import_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReferenceMaterialPage(BaseModel):
    items: list[ReferenceMaterialRead]
    total: int
    page: int
    page_size: int


class ReferenceSeedResult(BaseModel):
    source_count: int
    material_count: int


class ReferenceOptionGroup(BaseModel):
    category: str
    label: str
    items: list[ReferenceMaterialRead]


class ReferenceOptionsResponse(BaseModel):
    groups: list[ReferenceOptionGroup]
