# NenäBot UI

Battery Inspection System - Web Interface

## Project Overview

NenäBot is a sophisticated battery inspection system that combines hardware (spectrometer, camera, robot arm) with a modern React-based web interface. This UI provides real-time monitoring, scan configuration, route planning, and data visualization for automated battery inspection workflows.

## Tech Stack

- **React 18** with TypeScript (strict mode)
- **Vite 6** - Fast build tooling with SWC
- **Tailwind CSS v4** - Utility-first styling with Material Design 3 tokens
- **Lucide React** - Icon library
- **Recharts** - Data visualization

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Runs at `http://localhost:3000`

### Production Build

```bash
npm run build
```

Output: `build/` directory

## Configuration

Copy `.env.example` to `.env.development` and configure:

```bash
VITE_API_URL=http://localhost:8000        # Backend API endpoint
VITE_API_TIMEOUT=30000                    # Request timeout (ms)
VITE_USE_MOCK_DATA=true                   # Use mock data for development
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with navigation
│   ├── StatusCards.tsx # Hardware status cards
│   ├── TabNavigation.tsx
│   └── ...             # Feature-specific components
├── hooks/              # Custom React hooks
│   └── useHardwareData.ts
├── services/           # API client and business logic
│   └── apiClient.ts    # HTTP client with retry logic
├── types/              # TypeScript type definitions
│   └── hardware.types.ts
├── config/             # App configuration
│   └── app.config.ts
├── mocks/              # Mock data for development
│   └── hardwareMocks.ts
└── styles/             # Global styles and design tokens
    └── globals.css
```

## Key Features

- **Real-time Hardware Monitoring** - Live status of spectrometer, camera, and robot arm
- **Scan Configuration** - Flexible parameter setup for inspection workflows
- **Route Planning** - Interactive scan pattern configuration
- **Progress Tracking** - Real-time measurement monitoring
- **Results Visualization** - Data analysis and export

## Development Guide

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Complete setup instructions
- API integration guide
- Component development best practices
- Troubleshooting
- Architecture decisions

## API Integration

The UI communicates with a backend API for hardware control and data management. Set `VITE_USE_MOCK_DATA=false` when connecting to a real backend.

Expected backend endpoint: `GET /api/hardware/status`

See [DEVELOPMENT.md](DEVELOPMENT.md) for full API documentation.

## License

MIT

## Attributions
License

MIT