import { JobEventApiResponse } from '../services/apiCalls';
import { ProgressTabState } from '../types/progress.types';

export const mockJobEvents: JobEventApiResponse[] = [
  {
    type: 'job:snapshot',
    jobId: 'mock-job-1',
    state: 'running',
    lastPointProcessed: 3,
    totalPoints: 10,
    timestamp: '2026-04-03T14:32:15.000Z',
  },
  {
    type: 'job:waypoint_completed',
    jobId: 'mock-job-1',
    state: 'running',
    lastPointProcessed: 4,
    totalPoints: 10,
    timestamp: '2026-04-03T14:32:18.000Z',
    measurement: {
      waypointIndex: 4,
      waypoint: { x: 12, y: 24, z: 0, r: 0 },
      pixelX: 210,
      pixelY: 160,
      scanResult: { evaluation: { intensityTopAverage: 0.87 } },
      simulated: true,
      timestamp: '2026-04-03T14:32:18.000Z',
    },
  },
  {
    type: 'job:waypoint_started',
    jobId: 'mock-job-1',
    state: 'running',
    lastPointProcessed: 4,
    totalPoints: 10,
    timestamp: '2026-04-03T14:32:20.000Z',
  },
];

// Backward-compatible fixture retained for tests that compare full tab state.
export const mockProgressTabState: ProgressTabState = {
  scan: {
    state: 'running',
    completedPoints: 4,
    totalPoints: 10,
    elapsedSeconds: 0,
    estimatedRemainingSeconds: 6,
  },
  events: [
    { id: 1, time: '2:32:15 PM', level: 'info', message: 'job:snapshot' },
    { id: 2, time: '2:32:18 PM', level: 'success', message: 'job:waypoint_completed' },
    { id: 3, time: '2:32:20 PM', level: 'info', message: 'job:waypoint_started' },
  ],
  measurements: [
    {
      id: 1,
      point: 'WP-4',
      wavelength: '-',
      intensity: 0.87,
      timestamp: '4/3/2026, 2:32:18 PM',
      rawScanResult: { evaluation: { intensityTopAverage: 0.87 } },
      status: 'complete',
    },
  ],
  lastEventType: 'job:waypoint_started',
};
