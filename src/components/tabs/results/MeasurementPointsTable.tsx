import { useEffect, useMemo, useState } from 'react';
import {
  formatDateTime,
  formatMeasuredValue,
  isCriticalMeasurement,
  MeasurementPoint,
} from './results.model';

interface MeasurementPointsTableProps {
  points: MeasurementPoint[];
  criticalThreshold: number;
  selectedPointId: string | null;
  onSelectPoint: (pointId: string) => void;
}

type SortField = 'label' | 'waypointIndex' | 'timestamp' | 'measuredValue' | 'x' | 'y';
type SortDirection = 'asc' | 'desc';

export function MeasurementPointsTable({
  points,
  criticalThreshold,
  selectedPointId,
  onSelectPoint,
}: MeasurementPointsTableProps) {
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedPoints = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = points.filter((point) => {
      if (criticalOnly && !isCriticalMeasurement(point, criticalThreshold)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        point.id.toLowerCase().includes(normalizedQuery) ||
        point.label.toLowerCase().includes(normalizedQuery) ||
        point.comment.toLowerCase().includes(normalizedQuery)
      );
    });

    filtered.sort((a, b) => {
      let result = 0;

      switch (sortField) {
        case 'label':
          result = a.label.localeCompare(b.label);
          break;
        case 'waypointIndex':
          result = a.waypointIndex - b.waypointIndex;
          break;
        case 'measuredValue':
          result = a.measuredValue - b.measuredValue;
          break;
        case 'x':
          result = a.x - b.x;
          break;
        case 'y':
          result = a.y - b.y;
          break;
        case 'timestamp':
        default:
          result = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
      }

      return sortDirection === 'asc' ? result : -result;
    });

    return filtered;
  }, [criticalOnly, criticalThreshold, points, searchQuery, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPoints.length / rowsPerPage));

  const pagedPoints = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAndSortedPoints.slice(start, end);
  }, [currentPage, filteredAndSortedPoints, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!selectedPointId || filteredAndSortedPoints.length === 0) {
      return;
    }

    const selectedIndex = filteredAndSortedPoints.findIndex(
      (point) => point.id === selectedPointId,
    );

    if (selectedIndex < 0) {
      return;
    }

    const selectedPage = Math.floor(selectedIndex / rowsPerPage) + 1;
    setCurrentPage((prev) => (prev === selectedPage ? prev : selectedPage));
  }, [filteredAndSortedPoints, rowsPerPage, selectedPointId]);

  const firstItemIndex =
    filteredAndSortedPoints.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastItemIndex = Math.min(filteredAndSortedPoints.length, currentPage * rowsPerPage);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      setCurrentPage(1);
      return;
    }

    setSortField(field);
    setSortDirection('asc');
    setCurrentPage(1);
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return '';
    }

    return sortDirection === 'asc' ? ' ^' : ' v';
  };

  const sortAriaLabel = (field: SortField, label: string) => {
    const nextDirection =
      sortField === field && sortDirection === 'asc' ? 'descending' : 'ascending';
    return `Sort by ${label} (${nextDirection})`;
  };

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)]">
      <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium">Measurement Points</h3>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--md-sys-color-on-surface-variant)]">Rows</span>
            <select
              value={rowsPerPage}
              onChange={(event) => {
                const nextRows = Number(event.target.value);
                setRowsPerPage(nextRows);
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-[var(--md-sys-color-outline)] rounded bg-[var(--md-sys-color-surface)]"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter by id, label or comment"
            className="px-3 py-2 border border-[var(--md-sys-color-outline)] rounded bg-[var(--md-sys-color-surface)] text-sm"
          />

          <label className="flex items-center gap-2 text-sm px-3 py-2 border border-[var(--md-sys-color-outline)] rounded">
            <input
              type="checkbox"
              checked={criticalOnly}
              onChange={(event) => {
                setCriticalOnly(event.target.checked);
                setCurrentPage(1);
              }}
            />
            Show critical only
          </label>

          <div className="hidden md:block" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSortChange('label')}
                  className="inline-flex items-center gap-1 hover:underline"
                  aria-label={sortAriaLabel('label', 'point')}
                >
                  Point{sortIndicator('label')}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSortChange('waypointIndex')}
                  className="inline-flex items-center gap-1 hover:underline"
                  aria-label={sortAriaLabel('waypointIndex', 'waypoint')}
                >
                  Waypoint{sortIndicator('waypointIndex')}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSortChange('x')}
                  className="inline-flex items-center gap-1 hover:underline"
                  aria-label={sortAriaLabel('x', 'X position')}
                >
                  X{sortIndicator('x')}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSortChange('y')}
                  className="inline-flex items-center gap-1 hover:underline"
                  aria-label={sortAriaLabel('y', 'Y position')}
                >
                  Y{sortIndicator('y')}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSortChange('measuredValue')}
                  className="inline-flex items-center gap-1 hover:underline"
                  aria-label={sortAriaLabel('measuredValue', 'measured value')}
                >
                  Measured Value{sortIndicator('measuredValue')}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium">Comment</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSortChange('timestamp')}
                  className="inline-flex items-center gap-1 hover:underline"
                  aria-label={sortAriaLabel('timestamp', 'timestamp')}
                >
                  Timestamp{sortIndicator('timestamp')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedPoints.map((point) => {
              const isSelected = point.id === selectedPointId;
              const isCritical = isCriticalMeasurement(point, criticalThreshold);

              return (
                <tr
                  key={point.id}
                  onClick={() => onSelectPoint(point.id)}
                  className={`border-t border-[var(--md-sys-color-outline-variant)] cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-primary-container)]/40'
                      : isCritical
                        ? 'bg-red-50 hover:bg-red-100'
                        : 'hover:bg-[var(--md-sys-color-surface-container-low)]'
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{point.label}</td>
                  <td className="px-4 py-3">#{point.waypointIndex}</td>
                  <td className="px-4 py-3">{point.x.toFixed(3)}</td>
                  <td className="px-4 py-3">{point.y.toFixed(3)}</td>
                  <td className={`px-4 py-3 ${isCritical ? 'font-semibold text-red-700' : ''}`}>
                    {formatMeasuredValue(point.measuredValue)}
                  </td>
                  <td className="px-4 py-3">{point.comment || '-'}</td>
                  <td className="px-4 py-3">
                    {isCritical ? (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 border border-red-200">
                        Critical
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(point.timestamp)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
        <p className="text-[var(--md-sys-color-on-surface-variant)]">
          Showing {firstItemIndex}-{lastItemIndex} of {filteredAndSortedPoints.length}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-[var(--md-sys-color-outline)] rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="min-w-20 text-center">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border border-[var(--md-sys-color-outline)] rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
