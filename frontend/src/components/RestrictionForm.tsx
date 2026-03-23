import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, SendHorizonal, CheckCircle } from 'lucide-react';
import type {
  RestrictionFormData,
  RestrictionType,
  Direction,
  VehicleClass,
  RestrictionStatus,
  Restriction,
} from '../lib/types';
import { segmentsApi, restrictionsApi } from '../lib/api';
import {
  restrictionTypeLabels,
  vehicleClassLabels,
} from '../lib/colors';

const RESTRICTION_TYPES: RestrictionType[] = [
  'full_closure',
  'one_way',
  'no_private_cars',
  'residents_only',
  'pedestrian_priority',
  'seasonal_restriction',
];

const DIRECTIONS: Direction[] = ['both', 'forward', 'backward'];

const VEHICLE_CLASSES: VehicleClass[] = [
  'private_car',
  'taxi',
  'bus',
  'truck',
  'motorcycle',
  'bicycle',
  'emergency',
  'delivery',
];

interface RestrictionFormProps {
  existing?: Restriction;
  defaultSegmentId?: number;
}

export default function RestrictionForm({
  existing,
  defaultSegmentId,
}: RestrictionFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<RestrictionFormData>({
    road_segment_id: existing?.road_segment_id ?? defaultSegmentId ?? 0,
    restriction_type: existing?.restriction_type ?? 'full_closure',
    title: existing?.title ?? '',
    description: existing?.description ?? '',
    direction: existing?.direction ?? 'both',
    vehicle_classes: existing?.vehicle_classes ?? [],
    start_date: existing?.start_date?.split('T')[0] ?? '',
    end_date: existing?.end_date?.split('T')[0] ?? '',
    recurrence: existing?.recurrence ?? '',
    legal_basis: existing?.legal_basis ?? '',
    status: existing?.status ?? 'draft',
  });

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: segmentsApi.list,
  });

  useEffect(() => {
    if (defaultSegmentId && !existing) {
      setForm((f) => ({ ...f, road_segment_id: defaultSegmentId }));
    }
  }, [defaultSegmentId, existing]);

  const mutation = useMutation({
    mutationFn: (data: RestrictionFormData) =>
      existing
        ? restrictionsApi.update(existing.id, data)
        : restrictionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restrictions'] });
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      navigate('/restrictions');
    },
  });

  const handleSubmit = (statusOverride?: RestrictionStatus) => {
    const data = statusOverride ? { ...form, status: statusOverride } : form;
    mutation.mutate(data);
  };

  const toggleVehicleClass = (vc: VehicleClass) => {
    setForm((f) => ({
      ...f,
      vehicle_classes: f.vehicle_classes.includes(vc)
        ? f.vehicle_classes.filter((v) => v !== vc)
        : [...f.vehicle_classes, vc],
    }));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-6">
        {/* Segment selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Road Segment
          </label>
          <select
            value={form.road_segment_id}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                road_segment_id: Number(e.target.value),
              }))
            }
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          >
            <option value={0}>Select a segment...</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Restriction Type
          </label>
          <select
            value={form.restriction_type}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                restriction_type: e.target.value as RestrictionType,
              }))
            }
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          >
            {RESTRICTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {restrictionTypeLabels[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            placeholder="e.g., Summer pedestrian zone"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Direction
          </label>
          <select
            value={form.direction}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                direction: e.target.value as Direction,
              }))
            }
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          >
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Classes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Affected Vehicle Classes
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VEHICLE_CLASSES.map((vc) => (
              <label
                key={vc}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  form.vehicle_classes.includes(vc)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.vehicle_classes.includes(vc)}
                  onChange={() => toggleVehicleClass(vc)}
                  className="sr-only"
                />
                {vehicleClassLabels[vc]}
              </label>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Start Date
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_date: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              End Date
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, end_date: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Recurrence */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Recurrence
          </label>
          <input
            type="text"
            value={form.recurrence}
            onChange={(e) =>
              setForm((f) => ({ ...f, recurrence: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            placeholder="e.g., daily 09:00-18:00, or May-October"
          />
        </div>

        {/* Legal Basis */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Legal Basis
          </label>
          <input
            type="text"
            value={form.legal_basis}
            onChange={(e) =>
              setForm((f) => ({ ...f, legal_basis: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            placeholder="e.g., Municipal Decision 123/2026"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
          <button
            onClick={() => handleSubmit()}
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save as {form.status === 'draft' ? 'Draft' : form.status}
          </button>

          {form.status === 'draft' && (
            <button
              onClick={() => handleSubmit('approved')}
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <SendHorizonal className="h-4 w-4" />
              Submit for Review
            </button>
          )}

          {form.status === 'approved' && (
            <button
              onClick={() => handleSubmit('published')}
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Approve & Publish
            </button>
          )}

          <button
            onClick={() => navigate(-1)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>

        {mutation.isError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            Error: {(mutation.error as Error).message}
          </div>
        )}
      </div>
    </div>
  );
}
