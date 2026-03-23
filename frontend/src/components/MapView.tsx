import { useState, useCallback, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, Search, ChevronRight, Navigation } from 'lucide-react';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import { segmentsApi } from '../lib/api';
import { getSegmentColor, restrictionTypeLabels } from '../lib/colors';
import type { RoadSegment, RestrictionType } from '../lib/types';
import SegmentPanel from './SegmentPanel';

const CORFU_CENTER: LatLngExpression = [39.624, 19.922];

function DrawingLayer({
  points,
  onAddPoint,
}: {
  points: LatLngExpression[];
  onAddPoint: (latlng: LatLngExpression) => void;
}) {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (points.length < 2) return null;
  return <Polyline positions={points} color="#1270ea" weight={4} dashArray="8 6" />;
}

// Fit map to a segment when selected
function FitToSegment({ segment }: { segment: RoadSegment | null }) {
  const map = useMap();
  useEffect(() => {
    if (!segment) return;
    const coords = segment.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 19 });
    }
  }, [segment, map]);
  return null;
}

// Route planner component
function RoutePlanner({
  active,
  segments,
}: {
  active: boolean;
  segments: RoadSegment[];
}) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!active) {
      // Clean up routing when deactivated
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
      return;
    }

    // Create routing control
    const control = L.Routing.control({
      waypoints: [],
      routeWhileDragging: true,
      addWaypoints: true,
      fitSelectedRoutes: true,
      showAlternatives: true,
      lineOptions: {
        styles: [
          { color: '#3b82f6', weight: 6, opacity: 0.8 },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      altLineOptions: {
        styles: [
          { color: '#94a3b8', weight: 4, opacity: 0.6, dashArray: '10 10' },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      // @ts-expect-error leaflet-routing-machine types are incomplete
      createMarker: (i: number, wp: L.Routing.Waypoint) => {
        const marker = L.marker(wp.latLng, {
          draggable: true,
          icon: L.divIcon({
            className: '',
            html: `<div style="
              background: ${i === 0 ? '#22c55e' : '#ef4444'};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">${i === 0 ? 'A' : 'B'}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        });
        markersRef.current.push(marker);
        return marker;
      },
    });

    control.addTo(map);
    routingControlRef.current = control;

    // On route found, check for conflicts with restrictions
    control.on('routesfound', (e: L.Routing.RoutingResultEvent) => {
      const route = e.routes[0];
      if (!route) return;
      // Check if route passes near any restricted segments
      const routeCoords = route.coordinates ?? [];
      const conflicts: string[] = [];

      segments.forEach((seg) => {
        if (!seg.restrictions || seg.restrictions.length === 0) return;
        const segCoords = seg.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => L.latLng(lat, lng)
        );
        for (const rc of routeCoords) {
          const routePoint = L.latLng(rc.lat, rc.lng);
          for (const sc of segCoords) {
            if (routePoint.distanceTo(sc) < 30) {
              const types = seg.restrictions!
                .map((r) => restrictionTypeLabels[r.restriction_type as RestrictionType] || r.restriction_type)
                .join(', ');
              conflicts.push(`${seg.name}: ${types}`);
              return;
            }
          }
        }
      });

      if (conflicts.length > 0 && routeCoords.length > 0) {
        L.popup()
          .setLatLng(routeCoords[Math.floor(routeCoords.length / 2)])
          .setContent(
            `<div style="font-family: system-ui; max-width: 250px;">
              <div style="font-weight: 600; color: #dc2626; margin-bottom: 6px;">
                ⚠ Route Conflicts
              </div>
              <div style="font-size: 13px; color: #475569;">
                This route passes through restricted streets:
              </div>
              <ul style="margin: 6px 0; padding-left: 16px; font-size: 12px; color: #334155;">
                ${conflicts.map((c) => `<li style="margin-bottom: 2px;">${c}</li>`).join('')}
              </ul>
            </div>`
          )
          .openOn(map);
      }
    });

    // Click to set waypoints
    const onClick = (e: L.LeafletMouseEvent) => {
      const waypoints = control.getWaypoints();
      const emptyIdx = waypoints.findIndex((wp) => !wp.latLng);
      if (emptyIdx !== -1) {
        waypoints[emptyIdx].latLng = e.latlng;
        control.setWaypoints(waypoints);
      } else if (waypoints.length < 2 || (!waypoints[0].latLng && !waypoints[1].latLng)) {
        control.setWaypoints([
          L.Routing.waypoint(e.latlng),
          L.Routing.waypoint(L.latLng(0, 0)),
        ]);
      }
    };

    map.on('click', onClick);

    return () => {
      map.off('click', onClick);
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [active, map, segments]);

  return null;
}

export default function MapView() {
  const queryClient = useQueryClient();
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<LatLngExpression[]>([]);
  const [showSegmentList, setShowSegmentList] = useState(false);
  const [segmentSearch, setSegmentSearch] = useState('');
  const [routePlannerActive, setRoutePlannerActive] = useState(false);

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: segmentsApi.list,
  });

  const createSegment = useMutation({
    mutationFn: segmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      setDrawing(false);
      setDrawPoints([]);
    },
  });

  const handleAddPoint = useCallback(
    (latlng: LatLngExpression) => {
      if (!drawing) return;
      setDrawPoints((prev) => [...prev, latlng]);
    },
    [drawing]
  );

  const handleFinishDrawing = () => {
    if (drawPoints.length < 2) return;
    const name = prompt('Segment name:');
    if (!name) return;
    const coordinates = (drawPoints as [number, number][]).map(([lat, lng]) => [lng, lat]);
    createSegment.mutate({
      name,
      geometry: { type: 'LineString', coordinates },
    });
  };

  const handleCancelDrawing = () => {
    setDrawing(false);
    setDrawPoints([]);
  };

  // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
  const toLatLngs = (coords: [number, number][]): LatLngExpression[] =>
    coords.map(([lng, lat]) => [lat, lng]);

  const filteredSegments = segmentSearch
    ? segments.filter(
        (s) =>
          s.name.toLowerCase().includes(segmentSearch.toLowerCase()) ||
          s.name_gr?.toLowerCase().includes(segmentSearch.toLowerCase())
      )
    : segments;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={CORFU_CENTER}
        zoom={17}
        maxZoom={22}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={22}
          maxNativeZoom={20}
        />

        <FitToSegment segment={selectedSegment} />
        <RoutePlanner active={routePlannerActive} segments={segments} />

        {segments.map((seg) => {
          const positions = toLatLngs(seg.geometry.coordinates);
          const isSelected = selectedSegment?.id === seg.id;
          const color = isSelected ? '#3b82f6' : getSegmentColor(seg.restrictions);

          return (
            <span key={seg.id}>
              {/* Invisible wide polyline for easy clicking */}
              <Polyline
                positions={positions}
                color="transparent"
                weight={24}
                opacity={0}
                eventHandlers={{
                  click: () => {
                    if (!routePlannerActive) {
                      setSelectedSegment(seg);
                      setShowSegmentList(false);
                    }
                  },
                }}
              />
              {/* Outer glow for selected */}
              {isSelected && (
                <Polyline
                  positions={positions}
                  color="#3b82f6"
                  weight={16}
                  opacity={0.25}
                />
              )}
              {/* Inner glow for selected */}
              {isSelected && (
                <Polyline
                  positions={positions}
                  color="#3b82f6"
                  weight={10}
                  opacity={0.4}
                />
              )}
              {/* Visible polyline */}
              <Polyline
                positions={positions}
                color={color}
                weight={isSelected ? 6 : 4}
                opacity={isSelected ? 1 : 0.85}
                eventHandlers={{
                  click: () => {
                    if (!routePlannerActive) {
                      setSelectedSegment(seg);
                      setShowSegmentList(false);
                    }
                  },
                }}
              >
                <Tooltip sticky>
                  <div style={{ fontFamily: 'system-ui' }}>
                    <div style={{ fontWeight: 600 }}>{seg.name}</div>
                    {seg.name_gr && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{seg.name_gr}</div>
                    )}
                    {seg.restrictions && seg.restrictions.length > 0 && (
                      <div style={{ fontSize: '11px', marginTop: '2px' }}>
                        {seg.restrictions.map((r) =>
                          restrictionTypeLabels[r.restriction_type as RestrictionType] || r.restriction_type
                        ).join(', ')}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Polyline>
            </span>
          );
        })}

        {drawing && (
          <DrawingLayer points={drawPoints} onAddPoint={handleAddPoint} />
        )}
      </MapContainer>

      {/* Top controls */}
      <div className="absolute left-3 top-3 z-[1000] flex gap-2">
        {!drawing ? (
          <>
            <button
              onClick={() => setShowSegmentList(!showSegmentList)}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-md hover:bg-slate-50"
            >
              <Search className="h-4 w-4" />
              Find Street
            </button>
            <button
              onClick={() => setDrawing(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-md hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Draw Segment
            </button>
            <button
              onClick={() => {
                setRoutePlannerActive(!routePlannerActive);
                setSelectedSegment(null);
                setShowSegmentList(false);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-md ${
                routePlannerActive
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Navigation className="h-4 w-4" />
              Route Planner
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleFinishDrawing}
              disabled={drawPoints.length < 2}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-md hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Finish ({drawPoints.length} pts)
            </button>
            <button
              onClick={handleCancelDrawing}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-md hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Route planner instructions */}
      {routePlannerActive && (
        <div className="absolute top-14 left-3 z-[1000] rounded-lg bg-blue-600/90 backdrop-blur-sm px-4 py-2.5 text-sm text-white max-w-xs shadow-lg">
          <div className="font-medium mb-1">Route Planner Active</div>
          <div className="text-blue-100 text-xs">
            Click on the map to set start (A) and end (B) points.
            The route will be checked against street restrictions.
          </div>
        </div>
      )}

      {/* Segment search/list panel */}
      {showSegmentList && (
        <div className="absolute left-3 top-14 z-[1000] w-72 rounded-lg bg-white shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={segmentSearch}
                onChange={(e) => setSegmentSearch(e.target.value)}
                placeholder="Search streets..."
                className="w-full rounded-md border border-slate-200 py-1.5 pr-3 pl-8 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredSegments.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-400">No streets found</p>
            ) : (
              filteredSegments.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => {
                    setSelectedSegment(seg);
                    setShowSegmentList(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                    selectedSegment?.id === seg.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium">{seg.name}</div>
                    {seg.name_gr && (
                      <div className="text-xs text-slate-400">{seg.name_gr}</div>
                    )}
                    {seg.restrictions && seg.restrictions.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {seg.restrictions.map((r) => (
                          <span
                            key={r.id}
                            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: getSegmentColor([r]) }}
                          >
                            {restrictionTypeLabels[r.restriction_type as RestrictionType] || r.restriction_type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] rounded-lg bg-slate-900/80 backdrop-blur-sm px-3 py-2">
        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Legend</p>
        <div className="space-y-0.5">
          {Object.entries(restrictionTypeLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="h-0.5 w-4 rounded-full"
                style={{ backgroundColor: getSegmentColor([{ restriction_type: key }]) }}
              />
              <span className="text-[11px] text-slate-300">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 rounded-full bg-gray-400" />
            <span className="text-[11px] text-slate-300">No restriction</span>
          </div>
        </div>
      </div>

      {drawing && (
        <div className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-lg bg-slate-800/90 px-4 py-2 text-sm text-white">
          Click on the map to add points. Click "Finish" when done.
        </div>
      )}

      {selectedSegment && !routePlannerActive && (
        <SegmentPanel
          segment={selectedSegment}
          onClose={() => setSelectedSegment(null)}
        />
      )}
    </div>
  );
}
