import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { restrictionsApi } from '../lib/api';
import type { RestrictionStatus } from '../lib/types';
import { restrictionTypeLabels } from '../lib/colors';
import RestrictionCard from '../components/RestrictionCard';

export default function RestrictionsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const params: Record<string, string> = {};
  if (statusFilter) params.status = statusFilter;
  if (typeFilter) params.restriction_type = typeFilter;

  const { data: restrictions = [], isLoading } = useQuery({
    queryKey: ['restrictions', params],
    queryFn: () => restrictionsApi.list(Object.keys(params).length ? params : undefined),
  });

  const filtered = search
    ? restrictions.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : restrictions;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Restrictions</h1>
          <p className="text-sm text-slate-500">
            Manage road access restrictions
          </p>
        </div>
        <button
          onClick={() => navigate('/restrictions/new')}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New Restriction
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restrictions..."
            className="w-full rounded-md border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {(['draft', 'approved', 'published', 'expired'] as RestrictionStatus[]).map(
            (s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            )
          )}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
        >
          <option value="">All Types</option>
          {Object.entries(restrictionTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">No restrictions found</p>
          <button
            onClick={() => navigate('/restrictions/new')}
            className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Create one
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestrictionCard key={r.id} restriction={r} />
          ))}
        </div>
      )}
    </div>
  );
}
