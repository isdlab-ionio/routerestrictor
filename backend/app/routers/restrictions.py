from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Restriction
from app.schemas import (
    RestrictionCreate, RestrictionUpdate, RestrictionRead,
    RestrictionWithSegment, StatusUpdate,
)

router = APIRouter()

VALID_STATUSES = {"draft", "under_review", "approved", "published", "expired", "revoked"}
VALID_TYPES = {
    "full_closure", "one_way", "no_private_cars", "residents_only",
    "authorized_only", "delivery_windows", "pedestrian_priority",
    "unsuitable_for_cars", "width_restriction", "seasonal_restriction",
    "temporary_event", "emergency_only",
}


@router.get("/restrictions", response_model=list[RestrictionWithSegment])
def list_restrictions(
    status: Optional[str] = Query(None),
    restriction_type: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Restriction)
    if status:
        q = q.filter(Restriction.status == status)
    if restriction_type:
        q = q.filter(Restriction.restriction_type == restriction_type)
    if active:
        today = date.today()
        q = q.filter(
            Restriction.status.in_(["approved", "published"]),
            (Restriction.start_date <= today) | (Restriction.start_date.is_(None)),
            (Restriction.end_date >= today) | (Restriction.end_date.is_(None)),
        )
    return q.order_by(Restriction.created_at.desc()).all()


@router.get("/restrictions/active", response_model=list[RestrictionWithSegment])
def active_restrictions(db: Session = Depends(get_db)):
    today = date.today()
    results = (
        db.query(Restriction)
        .filter(
            Restriction.status.in_(["approved", "published"]),
            (Restriction.start_date <= today) | (Restriction.start_date.is_(None)),
            (Restriction.end_date >= today) | (Restriction.end_date.is_(None)),
        )
        .order_by(Restriction.created_at.desc())
        .all()
    )
    return results


@router.get("/restrictions/{restriction_id}", response_model=RestrictionWithSegment)
def get_restriction(restriction_id: int, db: Session = Depends(get_db)):
    r = db.query(Restriction).filter(Restriction.id == restriction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restriction not found")
    return r


@router.post("/restrictions", response_model=RestrictionRead, status_code=201)
def create_restriction(data: RestrictionCreate, db: Session = Depends(get_db)):
    if data.restriction_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid restriction_type: {data.restriction_type}")
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")
    r = Restriction(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.put("/restrictions/{restriction_id}", response_model=RestrictionRead)
def update_restriction(restriction_id: int, data: RestrictionUpdate, db: Session = Depends(get_db)):
    r = db.query(Restriction).filter(Restriction.id == restriction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restriction not found")
    for key, val in data.model_dump().items():
        setattr(r, key, val)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/restrictions/{restriction_id}/status", response_model=RestrictionRead)
def change_status(restriction_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    r = db.query(Restriction).filter(Restriction.id == restriction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restriction not found")
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")
    r.status = body.status
    if body.approved_by:
        r.approved_by = body.approved_by
    db.commit()
    db.refresh(r)
    return r


@router.delete("/restrictions/{restriction_id}", status_code=204)
def delete_restriction(restriction_id: int, db: Session = Depends(get_db)):
    r = db.query(Restriction).filter(Restriction.id == restriction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restriction not found")
    db.delete(r)
    db.commit()
