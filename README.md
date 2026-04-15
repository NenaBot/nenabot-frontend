# NenaBot UI

Web interface for the NenaBot battery inspection workflow.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Jest + Testing Library
- Playwright (UI tests)

## Project Structure

Small ASCII tree (main parts):

```text
nenabot-ui/
|-- src/
|   |-- components/
|   |   |-- tabs/
|   |   |   |-- SetupTab.tsx
|   |   |   |-- CameraTab.tsx
|   |   |   |-- RouteTab.tsx
|   |   |   |-- ProgressTab.tsx
|   |   |   `-- ResultsTab.tsx
|   |   |-- shared/
|   |-- hooks/
|   |-- services/
|   |-- mocks/
|   |-- config/
|   |-- styles/
|   |-- types/
|   `-- test/
|       |-- components/
|       |-- hooks/
|       `-- services/
|-- tests-ui/
|-- .github/workflows/
|   |-- unit-tests.yml
|   `-- ui-tests.yml
|-- build/
|-- DEVELOPMENT.md
`-- package.json
```

## Basic Structure Principles

- Feature-first UI organization: tab-specific logic lives under `src/components/tabs/`.
- Shared UI stays reusable: common elements are in `src/components/` and `src/components/shared/`.
- Separation of concerns:
    - UI rendering in `components/`
    - Data access in `services/`
    - App/runtime settings in `config/`
    - Domain types in `types/`
    - Development fallback data in `mocks/`
- Keep side effects in hooks: data polling/fetching behavior belongs in custom hooks (for example `useHardwareData`).
- Test conventions:
    - Unit tests in `src/test/` (organized by area such as `components/`, `hooks/`, `services/`)
    - UI/E2E tests in `tests-ui/`

## CI Workflows

Two independent workflows run in GitHub Actions:

- Unit tests: `.github/workflows/unit-tests.yml`
    - Installs dependencies with `npm ci`
    - Runs `npm test`
- UI tests: `.github/workflows/ui-tests.yml`
    - Installs dependencies with `npm ci`
    - Installs Playwright browsers
    - Runs `npm run test:ui`
    - Uploads Playwright report artifacts

Why this split exists:

- Clear PR checks (`unit-tests` and `ui-tests` appear separately)
- Faster diagnosis when only one test layer fails
- Easier branch protection rules per test type

## Setup And Run Instructions

### 1. Requirements

- Node.js 18+
- npm 9+

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

The repository includes:

- `.env.example`
- `.env.development`
- `.env.production`

If needed, copy and edit values based on your backend:

```bash
cp .env.example .env.development
```

Common variables:

- `VITE_API_URL` (backend base URL)
- `VITE_API_TIMEOUT` (request timeout in ms)
- `VITE_USE_MOCK_DATA` (`false` by default in development; set `true` to force frontend mock data)

### 4. Start development server

```bash
npm run dev
```

By default Vite serves locally and prints the exact URL in terminal.

### 5. Build for production

```bash
npm run build
```

Output is generated in `build/`.

### 6. Run checks and tests

```bash
npm run lint
npm run test
npm run test:ui
```

Optional Playwright debug mode:

```bash
npm run test:ui:debug
```

## Useful Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Production build
- `npm run lint` - ESLint checks for `src/`
- `npm run test` - Jest tests
- `npm run test:ui` - Playwright UI tests
- `npm run test:ui:debug` - Playwright debug run
- `npm run format` - Prettier formatting for source files

## Additional Documentation

See `DEVELOPMENT.md` for deeper implementation notes, API integration details, and troubleshooting.
