import { ProgressTabState } from '../types/progress.types';

export const mockProgressTabState: ProgressTabState = {
  scan: {
    state: 'running',
    completedPoints: 847,
    totalPoints: 2500,
    elapsedSeconds: 4 * 60 + 12,
    estimatedRemainingSeconds: 8 * 60 + 15,
  },
  events: [
    { id: 1, time: '14:32:15', level: 'info', message: 'Scan started successfully' },
    { id: 2, time: '14:32:18', level: 'success', message: 'Spectrometer initialized' },
    { id: 3, time: '14:32:20', level: 'success', message: 'Calibration verified' },
    { id: 4, time: '14:32:25', level: 'info', message: 'Starting route navigation' },
    { id: 5, time: '14:32:30', level: 'info', message: 'Data collection in progress' },
  ],
  measurements: [
    { id: 1, point: 'A-001', wavelength: '450nm', intensity: 0.87, status: 'complete' },
    { id: 2, point: 'A-002', wavelength: '475nm', intensity: 0.92, status: 'complete' },
    { id: 3, point: 'A-003', wavelength: '500nm', intensity: 0.79, status: 'complete' },
    { id: 4, point: 'A-004', wavelength: '525nm', intensity: 0.85, status: 'processing' },
  ],
};
