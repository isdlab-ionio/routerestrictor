from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, Float, Date, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


class RoadSegment(Base):
    __tablename__ = "road_segment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_gr = Column(String, nullable=True)
    geometry = Column(Text, nullable=False)
    area = Column(String, nullable=False)
    width_m = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    restrictions = relationship(
        "Restriction", back_populates="road_segment", cascade="all, delete-orphan"
    )


class Restriction(Base):
    __tablename__ = "restriction"

    id = Column(Integer, primary_key=True, index=True)
    road_segment_id = Column(Integer, ForeignKey("road_segment.id"), nullable=False)
    restriction_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    direction = Column(String, nullable=True)
    vehicle_classes = Column(Text, nullable=True)  # JSON array
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    recurrence = Column(String, nullable=True)
    legal_basis = Column(String, nullable=True)
    status = Column(String, nullable=False, default="draft")
    evidence_notes = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    approved_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    road_segment = relationship("RoadSegment", back_populates="restrictions")


class FeedExportLog(Base):
    __tablename__ = "feed_export_log"

    id = Column(Integer, primary_key=True, index=True)
    export_type = Column(String, nullable=False)
    restriction_ids = Column(Text, nullable=False)  # JSON array
    status = Column(String, nullable=False, default="pending")
    file_path = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
