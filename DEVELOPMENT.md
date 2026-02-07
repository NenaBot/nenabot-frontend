# NenäBot UI - Development Guide

## Project Health Check Summary

### Fixed Issues ✅
- **TypeScript errors** in `vite-env.d.ts` - Proper interface hierarchy with Vite's `ImportMetaEnv`
- **Vite config aliases** - Removed 45+ broken version-pinned aliases (e.g., `sonner@2.0.3`) that were AI-generated
- **Broken CSS styling** - Fixed debug styling in StatusCards.tsx (red background with green borders)
- **Missing TypeScript config** - Added `tsconfig.json` with strict mode enabled
- **Environment setup** - Created `.env.example`, `.env.development`, `.env.production`
- **Material-UI bloat** - Removed unused MUI and Emotion dependencies (~2MB saved)
- **API integration** - Implemented proper API client service with retry logic + error handling

### Architecture Overview

```
src/
├── components/          # React components (UI layer)
├── hooks/              # Custom React hooks
├── services/           # Business logic (API client, etc)
├── types/              # TypeScript type definitions
├── config/             # App configuration
├── mocks/              # Mock data for development
└── styles/             # Global styles (Tailwind)
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.development` (already done):
```bash
VITE_API_URL=http://localhost:8000        # Backend API endpoint
VITE_API_TIMEOUT=30000                    # Request timeout in ms
VITE_USE_MOCK_DATA=true                   # Use mock data for development
```

### 3. Development Server
```bash
npm run dev
```

Runs at `http://localhost:3000`

### 4. Production Build
```bash
npm run build
```

Creates optimized bundle in `build/`

## API Integration

### Using the API Client
The `apiClient` service in `src/services/apiClient.ts` provides:
- Type-safe HTTP methods (`get`, `post`, `put`, `patch`, `delete`)
- Automatic retry logic (3 retries by default)
- Request timeout handling
- Error handling with `APIError` class

**Example:**
```typescript
import { apiClient, APIError } from '@/services/apiClient';

try {
  const data = await apiClient.get<HardwareStatus>('/api/hardware/status');
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error [${error.status}]: ${error.message}`);
  }
}
```

### Backend API Endpoints Required
Your backend should provide:

**GET `/api/hardware/status`**
```json
{
  "spectrometer": {
    "id": "spectrometer-1",
    "type": "spectrometer",
    "title": "Spectrometer",
    "status": "online|offline|error|warning|idle",
    "lastUpdate": "ISO timestamp",
    "wavelength": 532,
    "signalStrength": 97,
    "metrics": [
      { "label": "Signal Strength", "value": 97, "unit": "%", "percentage": 97 }
    ]
  },
  "camera": { /* similar structure */ },
  "robotarm": { /* similar structure */ }
}
```

## Configuration

### Tailwind CSS
- Config: `tailwind.config.js`
- Input: `src/index.css`
- Uses Material Design custom properties via `var(--md-sys-color-*)`

### TypeScript Strict Mode
Enabled in `tsconfig.json`:
- `strict: true` - All strict type checking options
- `noUnusedLocals: true` - Error on unused variables
- `noUnusedParameters: true` - Error on unused function params
- `noImplicitReturns: true` - Require explicit returns

### Vite Configuration
- **Plugin**: React with SWC (fast refresh)
- **Alias**: `@/` points to `src/`
- **Dev Server**: Port 3000, auto-open
- **Build**: Target `esnext`, output to `build/`

## Component Development Best Practices

### 1. **Use Hooks for Data Fetching**
```typescript
export function MyComponent() {
  const { spectrometer, isLoading, error } = useHardwareData();
  
  if (error) return <ErrorBoundary error={error} />;
  if (isLoading) return <Skeleton />;
  
  return <div>{spectrometer?.title}</div>;
}
```

### 2. **Use Tailwind Classes**
- Never inline CSS (use Tailwind)
- Avoid `!important` except when absolutely necessary
- Use Material Design tokens: `text-[var(--md-sys-color-primary)]`

### 3. **Type Everything**
```typescript
interface ComponentProps {
  title: string;
  status: HardwareStatus;
  onUpdate?: (data: HardwareData) => void;
}

export function MyComponent({ title, status, onUpdate }: ComponentProps) {
  // ...
}
```

### 4. **State Management Pattern**
- Use `useState` for local component state only
- Use hooks (`useHardwareData`) for shared state
- Consider adding a Context provider for global state if needed

## Troubleshooting

### API Connection Issues
1. Check `VITE_API_URL` in `.env.development` points to correct backend
2. Ensure backend API is running
3. Check CORS headers if calling cross-origin
4. Look at browser console for detailed error messages

### Styling Issues
1. Clear `build/` directory and rebuild
2. Make sure `index.css` imports `@tailwind` directives
3. Verify class names match Tailwind syntax
4. Check Material Design token names

### TypeScript Errors
1. Ensure all types are properly imported
2. Run `npm run build` to see full type-check output
3. Add explicit type annotations if inference fails
4. Don't use `any` - use `unknown` or proper types

## Maintenance Checklist

- [ ] Keep dependencies updated: `npm update`
- [ ] Run TypeScript type-check regularly: `npm run build`
- [ ] Test API integration with real backend
- [ ] Monitor bundle size: `npm run build` (check `build/` size)
- [ ] Update `.env.example` when adding new variables
- [ ] Document new API endpoints in this file
- [ ] Remove `VITE_USE_MOCK_DATA=true` before production

## Next Steps

1. **Connect to Real Backend**
   - Update `VITE_API_URL` environment variable
   - Set `VITE_USE_MOCK_DATA=false`
   - Test API endpoints in browser DevTools

2. **Improve State Management** (optional)
   - Add Redux/Zustand for complex state
   - Create Context provider for hardware data
   - Implement real-time updates with WebSocket

3. **Add Error Handling**
   - Create `<ErrorBoundary>` component
   - Display user-friendly error messages
   - Add retry buttons for failed requests

4. **Performance Optimization**
   - Split large components into smaller ones
   - Use `React.memo()` for expensive renders
   - Implement code-splitting for routes

5. **Testing**
   - Add Vitest + React Testing Library
   - Write tests for API client
   - Test component rendering with mocks

## Support
For issues specific to:
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/primitives/docs/overview/introduction
- **Vite**: https://vitejs.dev/guide/
- **React**: https://react.dev/
