import json
from datetime import datetime, date
from typing import Any, Optional
from pydantic import BaseModel, field_validator, field_serializer

# ---------- Road Segment ----------

class RoadSegmentBase(BaseModel):
    name: str
    name_gr: Optional[str] = None
    geometry: Any  # GeoJSON object
    area: str
    width_m: Optional[float] = None
    notes: Optional[str] = None

    @field_validator("geometry", mode="before")
    @classmethod
    def parse_geometry(cls, v: Any) -> Any:
        if isinstance(v, str):
            return json.loads(v)
        return v


class RoadSegmentCreate(RoadSegmentBase):
    @field_serializer("geometry")
    def serialize_geometry(self, v: Any) -> str:
        if isinstance(v, dict):
            return json.dumps(v)
        return v


class RoadSegmentUpdate(RoadSegmentBase):
    @field_serializer("geometry")
    def serialize_geometry(self, v: Any) -> str:
        if isinstance(v, dict):
            return json.dumps(v)
        return v


class RoadSegmentRead(RoadSegmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- Restriction ----------

class RestrictionBase(BaseModel):
    road_segment_id: int
    restriction_type: str
    title: str
    description: Optional[str] = None
    direction: Optional[str] = None
    vehicle_classes: Any = None  # JSON array
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    recurrence: Optional[str] = None
    legal_basis: Optional[str] = None
    status: str = "draft"
    evidence_notes: Optional[str] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None

    @field_validator("vehicle_classes", mode="before")
    @classmethod
    def parse_vehicle_classes(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v


class RestrictionCreate(RestrictionBase):
    pass


class RestrictionUpdate(RestrictionBase):
    pass


class RestrictionRead(RestrictionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StatusUpdate(BaseModel):
    status: str
    approved_by: Optional[str] = None


# ---------- Composite ----------

class RoadSegmentWithRestrictions(RoadSegmentRead):
    restrictions: list[RestrictionRead] = []


class RestrictionWithSegment(RestrictionRead):
    road_segment: Optional[RoadSegmentRead] = None


# ---------- Dashboard ----------

class DashboardStats(BaseModel):
    total_segments: int
    total_restrictions: int
    by_status: dict[str, int]
    by_type: dict[str, int]
    expiring_soon: int


# ---------- Feed Export Log ----------

class FeedExportLogRead(BaseModel):
    id: int
    export_type: str
    restriction_ids: str
    status: str
    file_path: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
