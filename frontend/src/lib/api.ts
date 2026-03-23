import type {
  RoadSegment,
  Restriction,
  RestrictionFormData,
  DashboardStats,
  ExportParams,
} from './types';

const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Road Segments
export const segmentsApi = {
  list: () => request<RoadSegment[]>('/segments'),
  get: (id: number) => request<RoadSegment>(`/segments/${id}`),
  create: (data: { name: string; description?: string; geometry: unknown }) =>
    request<RoadSegment>('/segments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<RoadSegment>) =>
    request<RoadSegment>(`/segments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/segments/${id}`, { method: 'DELETE' }),
};

// Restrictions
export const restrictionsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Restriction[]>(`/restrictions${qs}`);
  },
  get: (id: number) => request<Restriction>(`/restrictions/${id}`),
  create: (data: RestrictionFormData) =>
    request<Restriction>('/restrictions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<RestrictionFormData>) =>
    request<Restriction>(`/restrictions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/restrictions/${id}`, { method: 'DELETE' }),
};

// Dashboard
export const dashboardApi = {
  stats: () => request<DashboardStats>('/dashboard/stats'),
};

// Export
export const exportApi = {
  preview: (params: ExportParams) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    return request<{ count: number }>(`/export/preview?${qs}`);
  },
  download: async (params: ExportParams) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    const res = await fetch(`${BASE_URL}/export/download?${qs}`);
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routerestrictor-export.${params.format}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
