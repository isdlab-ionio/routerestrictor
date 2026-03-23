import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restrictionsApi } from '../lib/api';
import RestrictionForm from '../components/RestrictionForm';

export default function RestrictionFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const defaultSegmentId = searchParams.get('segment_id')
    ? Number(searchParams.get('segment_id'))
    : undefined;

  const { data: existing, isLoading } = useQuery({
    queryKey: ['restriction', id],
    queryFn: () => restrictionsApi.get(Number(id)),
    enabled: !!id,
  });

  const isEdit = !!id;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Restriction' : 'New Restriction'}
        </h1>
        <p className="text-sm text-slate-500">
          {isEdit
            ? 'Update restriction details'
            : 'Define a new road access restriction'}
        </p>
      </div>

      {isEdit && isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : (
        <RestrictionForm
          existing={existing}
          defaultSegmentId={defaultSegmentId}
        />
      )}
    </div>
  );
}
