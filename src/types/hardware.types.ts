export type HardwareStatus = 'online' | 'offline' | 'error' | 'warning' | 'idle';

export interface BaseHardwareData {
  id: string;
  title: string;
  status: HardwareStatus;
  lastUpdate: Date;
  metrics: {
    label: string;
    value: string | number;
    unit?: string;
    percentage?: number; // For progress bars
  }[];
}

export interface SpectrometerData extends BaseHardwareData {
  type: 'spectrometer';
  wavelength?: number;
  signalStrength?: number;
  integrationTime?: number;
}

export interface CameraData extends BaseHardwareData {
  type: 'camera';
  resolution?: string;
  fps?: number;
  exposure?: number;
  captureMode?: 'continuous' | 'triggered' | 'idle';
}

export interface RobotArmData extends BaseHardwareData {
  type: 'robotarm';
  position?: {
    x: number;
    y: number;
    z: number;
  };
  jointAngles?: number[];
  gripperStatus?: 'open' | 'closed' | 'moving';
  operational?: boolean;
}

export type HardwareData = SpectrometerData | CameraData | RobotArmData;
