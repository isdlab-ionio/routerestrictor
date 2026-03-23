import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
}

export default function StatsCard({ title, value, icon: Icon, color = 'text-primary-600' }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-lg bg-slate-50 p-3 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
