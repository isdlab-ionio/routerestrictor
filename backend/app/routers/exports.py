import csv
import io
import json
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Restriction, FeedExportLog

router = APIRouter()


def _get_exportable(db: Session):
    return (
        db.query(Restriction)
        .filter(Restriction.status.in_(["approved", "published"]))
        .all()
    )


def _log_export(db: Session, export_type: str, restrictions, status="success", notes=None):
    ids = [r.id for r in restrictions]
    log = FeedExportLog(
        export_type=export_type,
        restriction_ids=json.dumps(ids),
        status=status,
        notes=notes,
    )
    db.add(log)
    db.commit()


@router.get("/export/geojson")
def export_geojson(db: Session = Depends(get_db)):
    restrictions = _get_exportable(db)
    features = []
    for r in restrictions:
        seg = r.road_segment
        try:
            geometry = json.loads(seg.geometry) if seg else None
        except (json.JSONDecodeError, TypeError):
            geometry = None

        feature = {
            "type": "Feature",
            "geometry": geometry,
            "properties": {
                "restriction_id": r.id,
                "segment_id": seg.id if seg else None,
                "segment_name": seg.name if seg else None,
                "segment_name_gr": seg.name_gr if seg else None,
                "area": seg.area if seg else None,
                "restriction_type": r.restriction_type,
                "title": r.title,
                "description": r.description,
                "direction": r.direction,
                "vehicle_classes": r.vehicle_classes,
                "start_date": r.start_date.isoformat() if r.start_date else None,
                "end_date": r.end_date.isoformat() if r.end_date else None,
                "recurrence": r.recurrence,
                "status": r.status,
            },
        }
        features.append(feature)

    collection = {"type": "FeatureCollection", "features": features}
    _log_export(db, "geojson", restrictions)
    return Response(
        content=json.dumps(collection, indent=2),
        media_type="application/geo+json",
        headers={"Content-Disposition": "attachment; filename=restrictions.geojson"},
    )


@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    restrictions = _get_exportable(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "restriction_id", "segment_name", "segment_name_gr", "area",
        "restriction_type", "title", "description", "direction",
        "vehicle_classes", "start_date", "end_date", "recurrence", "status",
    ])
    for r in restrictions:
        seg = r.road_segment
        writer.writerow([
            r.id,
            seg.name if seg else "",
            seg.name_gr if seg else "",
            seg.area if seg else "",
            r.restriction_type,
            r.title,
            r.description or "",
            r.direction or "",
            r.vehicle_classes or "",
            r.start_date.isoformat() if r.start_date else "",
            r.end_date.isoformat() if r.end_date else "",
            r.recurrence or "",
            r.status,
        ])

    _log_export(db, "csv", restrictions)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=restrictions.csv"},
    )


@router.get("/export/kml")
def export_kml(db: Session = Depends(get_db)):
    restrictions = _get_exportable(db)
    placemarks = []
    for r in restrictions:
        seg = r.road_segment
        coords_str = ""
        if seg:
            try:
                geom = json.loads(seg.geometry)
                if geom.get("type") == "LineString":
                    coords_str = " ".join(
                        f"{c[0]},{c[1]},0" for c in geom["coordinates"]
                    )
                elif geom.get("type") == "Polygon":
                    coords_str = " ".join(
                        f"{c[0]},{c[1]},0" for c in geom["coordinates"][0]
                    )
            except (json.JSONDecodeError, TypeError, KeyError):
                pass

        placemark = f"""    <Placemark>
      <name>{_xml_escape(r.title)}</name>
      <description>{_xml_escape(r.description or '')}</description>
      <ExtendedData>
        <Data name="restriction_type"><value>{r.restriction_type}</value></Data>
        <Data name="status"><value>{r.status}</value></Data>
        <Data name="segment_name"><value>{_xml_escape(seg.name if seg else '')}</value></Data>
      </ExtendedData>
      <LineString>
        <coordinates>{coords_str}</coordinates>
      </LineString>
    </Placemark>"""
        placemarks.append(placemark)

    kml = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Corfu Road Restrictions</name>
    <description>Exported {datetime.utcnow().isoformat()}</description>
{chr(10).join(placemarks)}
  </Document>
</kml>"""

    _log_export(db, "kml", restrictions)
    return Response(
        content=kml,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": "attachment; filename=restrictions.kml"},
    )


def _xml_escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
