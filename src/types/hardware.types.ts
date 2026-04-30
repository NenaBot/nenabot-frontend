/**
 * Type definitions for hardware status and device information.
 *
 * Defines types for hardware component states and status reporting.
 */
export type HardwareStatus = 'online' | 'offline' | 'error' | 'warning' | 'idle';

export type HardwareDeviceType = 'ionvision' | 'camera' | 'robot';

export interface HardwareMetric {
  label: string;
  value: string | number;
  unit?: string;
  percentage?: number;
}

export interface HardwareData {
  id: string;
  type: HardwareDeviceType;
  title: string;
  status: HardwareStatus;
  lastUpdate: Date;
  metrics: HardwareMetric[];
}
