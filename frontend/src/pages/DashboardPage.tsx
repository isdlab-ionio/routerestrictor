import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  ShieldAlert,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { dashboardApi } from '../lib/api';
import { restrictionTypeLabels, restrictionTypeColors } from '../lib/colors';
import type { RestrictionType } from '../lib/types';
import StatsCard from '../components/StatsCard';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.stats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Unable to load dashboard data.</p>
      </div>
    );
  }

  const published = stats.by_status?.published ?? 0;
  const approved = stats.by_status?.approved ?? 0;
  const draft = stats.by_status?.draft ?? 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Overview of road restrictions in Corfu
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Segments"
          value={stats.total_segments}
          icon={MapPin}
          color="text-slate-600"
        />
        <StatsCard
          title="Published"
          value={published}
          icon={ShieldAlert}
          color="text-green-600"
        />
        <StatsCard
          title="Pending Approval"
          value={draft + (stats.by_status?.under_review ?? 0)}
          icon={Clock}
          color="text-amber-600"
        />
        <StatsCard
          title="Expiring Soon"
          value={stats.expiring_soon}
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By type */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Restrictions by Type
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.by_type).map(([type, count]) => {
              const maxCount = Math.max(...Object.values(stats.by_type), 1);
              const pct = (count / maxCount) * 100;
              return (
                <div key={type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {restrictionTypeLabels[type as RestrictionType] || type}
                    </span>
                    <span className="font-medium text-slate-800">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          restrictionTypeColors[type as RestrictionType] ||
                          '#9ca3af',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By status */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Restrictions by Status
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.by_status).map(([status, count]) => {
              const maxCount = Math.max(...Object.values(stats.by_status), 1);
              const pct = (count / maxCount) * 100;
              const colors: Record<string, string> = {
                draft: '#9ca3af',
                under_review: '#f59e0b',
                approved: '#3b82f6',
                published: '#22c55e',
                expired: '#ef4444',
                revoked: '#6b7280',
              };
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600 capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-medium text-slate-800">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: colors[status] || '#9ca3af',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
