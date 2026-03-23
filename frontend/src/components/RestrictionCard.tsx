import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import type { Restriction } from '../lib/types';
import { restrictionTypeLabels, restrictionTypeColors } from '../lib/colors';
import StatusBadge from './StatusBadge';

interface RestrictionCardProps {
  restriction: Restriction;
}

export default function RestrictionCard({ restriction }: RestrictionCardProps) {
  const navigate = useNavigate();
  const typeColor = restrictionTypeColors[restriction.restriction_type];

  return (
    <div
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={() => navigate(`/restrictions/${restriction.id}/edit`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: typeColor }}
          />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {restrictionTypeLabels[restriction.restriction_type]}
          </span>
        </div>
        <StatusBadge status={restriction.status} />
      </div>

      <h3 className="mt-2 text-sm font-semibold text-slate-900">
        {restriction.title}
      </h3>

      {restriction.description && (
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
          {restriction.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(restriction.start_date), 'MMM d, yyyy')}
          {restriction.end_date && (
            <> &ndash; {format(new Date(restriction.end_date), 'MMM d, yyyy')}</>
          )}
        </span>
        {restriction.road_segment && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {restriction.road_segment.name}
          </span>
        )}
      </div>
    </div>
  );
}
