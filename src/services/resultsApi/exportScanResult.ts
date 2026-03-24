import { downloadContent } from './helpers';
import { getScanResult } from '.';

export async function exportScanResult(scanId: string, format: 'json' | 'csv'): Promise<void> {
  const result = await getScanResult(scanId);

  if (format === 'json') {
    downloadContent(scanId, 'json', JSON.stringify(result, null, 2));
    return;
  }

  const header = [
    'id',
    'label',
    'x',
    'y',
    'waypointIndex',
    'measuredValue',
    'comment',
    'timestamp',
  ];
  const rows = result.measurementPoints.map((point) =>
    [
      point.id,
      point.label,
      point.x,
      point.y,
      point.waypointIndex,
      point.measuredValue,
      point.comment,
      point.timestamp,
    ].join(','),
  );
  downloadContent(scanId, 'csv', [header.join(','), ...rows].join('\n'));
}
