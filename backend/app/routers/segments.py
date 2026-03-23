from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import RoadSegment
from app.schemas import (
    RoadSegmentCreate, RoadSegmentUpdate, RoadSegmentRead,
    RoadSegmentWithRestrictions,
)

router = APIRouter()


@router.get("/segments", response_model=list[RoadSegmentWithRestrictions])
def list_segments(area: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(RoadSegment)
    if area:
        q = q.filter(RoadSegment.area == area)
    return q.order_by(RoadSegment.name).all()


@router.get("/segments/{segment_id}", response_model=RoadSegmentWithRestrictions)
def get_segment(segment_id: int, db: Session = Depends(get_db)):
    seg = db.query(RoadSegment).filter(RoadSegment.id == segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    return seg


@router.post("/segments", response_model=RoadSegmentRead, status_code=201)
def create_segment(data: RoadSegmentCreate, db: Session = Depends(get_db)):
    dump = data.model_dump()
    if isinstance(dump["geometry"], dict):
        import json
        dump["geometry"] = json.dumps(dump["geometry"])
    seg = RoadSegment(**dump)
    db.add(seg)
    db.commit()
    db.refresh(seg)
    return seg


@router.put("/segments/{segment_id}", response_model=RoadSegmentRead)
def update_segment(segment_id: int, data: RoadSegmentUpdate, db: Session = Depends(get_db)):
    seg = db.query(RoadSegment).filter(RoadSegment.id == segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    dump = data.model_dump()
    if isinstance(dump["geometry"], dict):
        import json
        dump["geometry"] = json.dumps(dump["geometry"])
    for key, val in dump.items():
        setattr(seg, key, val)
    db.commit()
    db.refresh(seg)
    return seg


@router.delete("/segments/{segment_id}", status_code=204)
def delete_segment(segment_id: int, db: Session = Depends(get_db)):
    seg = db.query(RoadSegment).filter(RoadSegment.id == segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    db.delete(seg)
    db.commit()
