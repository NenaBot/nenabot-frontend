import packageJson from '../../package.json';

export const appConfig = {
  name: 'NenäBot',
  description: 'Battery Inspection System',
  version: packageJson.version,
  repository: {
    url: 'https://github.com/NenaBot',
    enabled: true,
  },
} as const;
