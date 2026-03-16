import { ProfileModel } from '../types/profile.types';

const mockProfiles: ProfileModel[] = [
  {
    name: 'default',
    description: 'Default profile for standard battery inspection runs.',
    settings: {
      workZ: 0,
      workR: 0,
      options: {
        scanMode: 'standard',
        integrationMs: 100,
      },
    },
  },
  {
    name: 'high-precision',
    description: 'Higher dwell settings for noisy environments.',
    settings: {
      workZ: 0,
      workR: 0,
      options: {
        scanMode: 'precision',
        integrationMs: 150,
      },
    },
  },
];

export function getMockProfiles(): ProfileModel[] {
  return mockProfiles;
}

export function getMockDefaultProfile(): ProfileModel {
  return mockProfiles[0];
}
