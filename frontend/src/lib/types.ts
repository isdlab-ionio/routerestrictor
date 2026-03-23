export type RestrictionType =
  | 'full_closure'
  | 'one_way'
  | 'no_private_cars'
  | 'residents_only'
  | 'pedestrian_priority'
  | 'seasonal_restriction';

export type RestrictionStatus = 'draft' | 'approved' | 'published' | 'expired';

export type Direction = 'both' | 'forward' | 'backward';

export type VehicleClass =
  | 'private_car'
  | 'taxi'
  | 'bus'
  | 'truck'
  | 'motorcycle'
  | 'bicycle'
  | 'emergency'
  | 'delivery';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RoadSegment {
  id: number;
  name: string;
  name_gr?: string;
  description?: string;
  area?: string;
  width_m?: number;
  notes?: string;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat] GeoJSON order
  };
  created_at: string;
  updated_at: string;
  restrictions?: Restriction[];
}

export interface Restriction {
  id: number;
  road_segment_id: number;
  restriction_type: RestrictionType;
  title: string;
  description?: string;
  direction: Direction;
  vehicle_classes: VehicleClass[];
  start_date: string;
  end_date?: string;
  recurrence?: string;
  legal_basis?: string;
  status: RestrictionStatus;
  evidence_notes?: string;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  road_segment?: RoadSegment;
}

export interface RestrictionFormData {
  road_segment_id: number;
  restriction_type: RestrictionType;
  title: string;
  description?: string;
  direction: Direction;
  vehicle_classes: VehicleClass[];
  start_date: string;
  end_date?: string;
  recurrence?: string;
  legal_basis?: string;
  status: RestrictionStatus;
}

export interface DashboardStats {
  total_segments: number;
  total_restrictions: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  expiring_soon: number;
}

export interface ExportParams {
  format: 'geojson' | 'csv' | 'kml';
  status?: RestrictionStatus;
  start_date?: string;
  end_date?: string;
}
