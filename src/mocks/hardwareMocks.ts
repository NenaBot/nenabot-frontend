import { HardwareData } from '../types/hardware.types';

export const mockIonvisionData: HardwareData = {
  id: 'ionvision-mock',
  type: 'ionvision',
  title: 'IonVision Mock',
  status: 'online',
  lastUpdate: new Date(Date.now() - 900),
  metrics: [
    { label: 'Service', value: 'Ready' },
    { label: 'Storage', value: 78, unit: '%', percentage: 78 },
    { label: 'Queue', value: 2, unit: 'jobs' },
    { label: 'Last Sync', value: '0.9s ago' },
  ],
};

export const mockCameraData: HardwareData = {
  id: 'camera-1',
  type: 'camera',
  title: 'Camera',
  status: 'online',
  lastUpdate: new Date(Date.now() - 500),
  metrics: [
    { label: 'Last Frame', value: '0.5s ago' },
    { label: 'Frame Rate', value: 30, unit: 'fps', percentage: 100 },
    { label: 'Resolution', value: '1920x1080' },
    { label: 'Exposure', value: 33.3, unit: 'ms' },
  ],
};

export const mockRobotData: HardwareData = {
  id: 'robot-1',
  type: 'robot',
  title: 'Robot Arm',
  status: 'idle',
  lastUpdate: new Date(Date.now() - 15000),
  metrics: [
    { label: 'Status', value: 'Ready' },
    { label: 'Position', value: 'X: 125.5, Y: 230.2, Z: 450.0', unit: 'mm' },
    { label: 'Gripper', value: 'Open' },
    { label: 'Last Movement', value: '15s ago' },
  ],
};

export const mockHardwareData = {
  ionvision: mockIonvisionData,
  camera: mockCameraData,
  robot: mockRobotData,
};
