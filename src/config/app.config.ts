import packageJson from '../../package.json';

export const appConfig = {
  name: 'NenäBot',
  description: 'Spectrometer Control System',
  version: packageJson.version,
  repository: {
    url: 'https://github.com', // Update with your actual repository URL
    enabled: true,
  },
} as const;
