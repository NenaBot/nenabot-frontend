import { SpectrometerData, CameraData, RobotArmData } from '../types/hardware.types';

export const mockSpectrometerData: SpectrometerData = {
  id: 'spectrometer-1',
  type: 'spectrometer',
  title: 'Spectrometer',
  status: 'online',
  lastUpdate: new Date(Date.now() - 2100), // 2.1s ago
  wavelength: 532,
  signalStrength: 97,
  integrationTime: 100,
  metrics: [
    { label: 'Last Reading', value: '2.1s ago' },
    { label: 'Signal Strength', value: 97, unit: '%', percentage: 97 },
    { label: 'Wavelength', value: 532, unit: 'nm' },
    { label: 'Integration Time', value: 100, unit: 'ms' }
  ]
};

export const mockCameraData: CameraData = {
  id: 'camera-1',
  type: 'camera',
  title: 'Camera',
  status: 'online',
  lastUpdate: new Date(Date.now() - 500), // 0.5s ago
  resolution: '1920x1080',
  fps: 30,
  exposure: 33.3,
  captureMode: 'continuous',
  metrics: [
    { label: 'Last Frame', value: '0.5s ago' },
    { label: 'Frame Rate', value: 30, unit: 'fps', percentage: 100 },
    { label: 'Resolution', value: '1920x1080' },
    { label: 'Exposure', value: 33.3, unit: 'ms' }
  ]
};

export const mockRobotArmData: RobotArmData = {
  id: 'robotarm-1',
  type: 'robotarm',
  title: 'Robot Arm',
  status: 'idle',
  lastUpdate: new Date(Date.now() - 15000), // 15s ago
  position: { x: 125.5, y: 230.2, z: 450.0 },
  jointAngles: [0, 45, -30, 90, 0, 0],
  gripperStatus: 'open',
  operational: true,
  metrics: [
    { label: 'Status', value: 'Ready' },
    { label: 'Position', value: 'X: 125.5, Y: 230.2, Z: 450.0', unit: 'mm' },
    { label: 'Gripper', value: 'Open' },
    { label: 'Last Movement', value: '15s ago' }
  ]
};

export const mockHardwareData = {
  spectrometer: mockSpectrometerData,
  camera: mockCameraData,
  robotarm: mockRobotArmData
};
