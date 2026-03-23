import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileJson, FileSpreadsheet, Globe } from 'lucide-react';
import { exportApi } from '../lib/api';
import type { ExportParams, RestrictionStatus } from '../lib/types';

const FORMAT_OPTIONS = [
  {
    value: 'geojson' as const,
    label: 'GeoJSON',
    description: 'Geographic data format for GIS tools',
    icon: FileJson,
  },
  {
    value: 'csv' as const,
    label: 'CSV',
    description: 'Spreadsheet-compatible tabular data',
    icon: FileSpreadsheet,
  },
  {
    value: 'kml' as const,
    label: 'KML',
    description: 'Google Earth / Maps format',
    icon: Globe,
  },
];

export default function ExportPage() {
  const [format, setFormat] = useState<ExportParams['format']>('geojson');
  const [status, setStatus] = useState<string>('published');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const params: ExportParams = {
    format,
    ...(status ? { status: status as RestrictionStatus } : {}),
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
  };

  const preview = useMutation({
    mutationFn: () => exportApi.preview(params),
    onSuccess: (data) => setPreviewCount(data.count),
  });

  const download = useMutation({
    mutationFn: () => exportApi.download(params),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Export Data</h1>
        <p className="text-sm text-slate-500">
          Download restriction data in various formats
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-8">
        {/* Format selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Export Format
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`flex flex-col items-center rounded-lg border-2 p-4 text-center transition-colors ${
                    format === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Icon
                    className={`mb-2 h-8 w-8 ${
                      format === opt.value
                        ? 'text-primary-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      format === opt.value
                        ? 'text-primary-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Filter Options
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="approved">Approved</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => preview.mutate()}
            disabled={preview.isPending}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {preview.isPending ? 'Counting...' : 'Preview Count'}
          </button>

          <button
            onClick={() => download.mutate()}
            disabled={download.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {download.isPending ? 'Exporting...' : `Download ${format.toUpperCase()}`}
          </button>
        </div>

        {previewCount !== null && (
          <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <span className="font-medium">{previewCount}</span> records match
            your filters
          </div>
        )}

        {download.isError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Export failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
