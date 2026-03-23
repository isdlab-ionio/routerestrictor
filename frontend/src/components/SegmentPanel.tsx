import { useNavigate } from 'react-router-dom';
import { X, Plus, AlertTriangle } from 'lucide-react';
import type { RoadSegment } from '../lib/types';
import { restrictionTypeLabels, restrictionTypeColors } from '../lib/colors';
import StatusBadge from './StatusBadge';

interface SegmentPanelProps {
  segment: RoadSegment;
  onClose: () => void;
}

export default function SegmentPanel({ segment, onClose }: SegmentPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="absolute right-0 top-0 z-[1000] h-full w-96 overflow-y-auto border-l border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">{segment.name}</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {segment.description && (
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-600">{segment.description}</p>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Restrictions
          </h3>
          <button
            onClick={() =>
              navigate(`/restrictions/new?segment_id=${segment.id}`)
            }
            className="flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {(!segment.restrictions || segment.restrictions.length === 0) ? (
          <div className="mt-4 flex flex-col items-center rounded-lg bg-slate-50 py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No restrictions</p>
            <p className="text-xs text-slate-400">Add one to get started</p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {segment.restrictions.map((r) => (
              <div
                key={r.id}
                className="cursor-pointer rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                onClick={() => navigate(`/restrictions/${r.id}/edit`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: restrictionTypeColors[r.restriction_type],
                      }}
                    />
                    <span className="text-xs text-slate-500">
                      {restrictionTypeLabels[r.restriction_type]}
                    </span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-800">
                  {r.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
