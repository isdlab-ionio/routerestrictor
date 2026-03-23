from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import RoadSegment, Restriction
from app.schemas import DashboardStats

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    total_segments = db.query(func.count(RoadSegment.id)).scalar()
    total_restrictions = db.query(func.count(Restriction.id)).scalar()

    # By status
    status_rows = (
        db.query(Restriction.status, func.count(Restriction.id))
        .group_by(Restriction.status)
        .all()
    )
    by_status = {s: c for s, c in status_rows}

    # By type
    type_rows = (
        db.query(Restriction.restriction_type, func.count(Restriction.id))
        .group_by(Restriction.restriction_type)
        .all()
    )
    by_type = {t: c for t, c in type_rows}

    # Expiring within 30 days
    soon = date.today() + timedelta(days=30)
    expiring_soon = (
        db.query(func.count(Restriction.id))
        .filter(
            Restriction.end_date.isnot(None),
            Restriction.end_date <= soon,
            Restriction.end_date >= date.today(),
            Restriction.status.in_(["approved", "published"]),
        )
        .scalar()
    )

    return DashboardStats(
        total_segments=total_segments,
        total_restrictions=total_restrictions,
        by_status=by_status,
        by_type=by_type,
        expiring_soon=expiring_soon,
    )
