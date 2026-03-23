from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RoadSegment, Restriction, FeedExportLog
from app.seed_data import SEGMENTS, RESTRICTIONS

router = APIRouter()


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    # Clear existing data
    db.query(FeedExportLog).delete()
    db.query(Restriction).delete()
    db.query(RoadSegment).delete()
    db.commit()

    # Insert segments
    segment_objects = []
    for seg_data in SEGMENTS:
        seg = RoadSegment(**seg_data)
        db.add(seg)
        db.flush()
        segment_objects.append(seg)

    # Insert restrictions
    restriction_count = 0
    for r_data in RESTRICTIONS:
        idx = r_data.pop("segment_index")
        r_data["road_segment_id"] = segment_objects[idx].id
        r = Restriction(**r_data)
        db.add(r)
        restriction_count += 1
        # Restore for re-runnability
        r_data["segment_index"] = idx
        del r_data["road_segment_id"]

    db.commit()

    return {
        "message": "Database seeded successfully",
        "segments_created": len(segment_objects),
        "restrictions_created": restriction_count,
    }
