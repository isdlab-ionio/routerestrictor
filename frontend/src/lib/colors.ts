import type { RestrictionType, RestrictionStatus } from './types';

export const restrictionTypeColors: Record<RestrictionType, string> = {
  full_closure: '#ef4444',       // red
  one_way: '#f97316',            // orange
  no_private_cars: '#a855f7',    // purple
  residents_only: '#3b82f6',     // blue
  pedestrian_priority: '#22c55e', // green
  seasonal_restriction: '#f59e0b', // amber
};

export const restrictionTypeLabels: Record<RestrictionType, string> = {
  full_closure: 'Full Closure',
  one_way: 'One Way',
  no_private_cars: 'No Private Cars',
  residents_only: 'Residents Only',
  pedestrian_priority: 'Pedestrian Priority',
  seasonal_restriction: 'Seasonal Restriction',
};

export const statusColors: Record<RestrictionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
};

export const statusLabels: Record<RestrictionStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  published: 'Published',
  expired: 'Expired',
};

export const vehicleClassLabels: Record<string, string> = {
  private_car: 'Private Car',
  taxi: 'Taxi',
  bus: 'Bus',
  truck: 'Truck',
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
  emergency: 'Emergency',
  delivery: 'Delivery',
};

export function getSegmentColor(restrictions?: { restriction_type?: string; type?: string }[]): string {
  if (!restrictions || restrictions.length === 0) return '#9ca3af'; // gray
  const t = (restrictions[0].restriction_type || restrictions[0].type) as RestrictionType;
  return restrictionTypeColors[t] || '#9ca3af';
}
