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
|   |-- ui-tests.yml
|   |-- linter.yml
|   `-- Build.yml
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
    - Colocated unit tests are supported and common under `__tests__/` folders near implementation files.
    - Centralized unit tests also exist in `src/test/` (organized by area such as `components/`, `hooks/`, `services/`).
    - Jest discovers tests via both patterns: `src/**/__tests__/**/*.{test,spec}.{ts,tsx}` and `src/**/*.{test,spec}.{ts,tsx}`.
    - UI/E2E tests are in `tests-ui/`.

- Component patterns and principles:
    - Prefer small, focused components that do one thing; prefer composition over large monolithic components.
    - Distinguish presentational (pure) components from stateful/container components where appropriate.
    - Keep domain and side-effect logic out of presentation layers — use hooks (`src/hooks/`) and services (`src/services/`) for data fetching, transformations, and API interaction.
    - Favor props-down / events-up data flow: pass data and callbacks via props; lift state when sibling coordination is needed.
    - Use TypeScript interfaces/types in `src/types/` to document component props and domain shapes.
    - Styling is done with Tailwind utility classes and project globals in `src/styles/globals.css`.
    - Aim for accessible markup: use semantic elements and ARIA attributes for interactive widgets and modals.
    - Write colocated tests for components to keep behavior and expectations near implementation.

## React Components

- Overview:
    - The UI is composed from small, focused React components grouped by feature under `src/components/`.
    - Tab views (`src/components/tabs/`) implement the main workflow screens and are composed into the top-level app layout.
    - Shared UI (`src/components/shared/`) contains reusable widgets like `RoutePreviewPanel`, `StatusCards`, and other building blocks used across tabs.
    - Modals and overlays are implemented under `src/components/modals/` and are typically controlled by parent components via props/state.

- How they work together:
    - The app shell (top-level routes / tab navigation) composes tab components and passes down required data via props.
    - Data fetching and subscriptions are handled in hooks (`src/hooks/`) and exposed to components as simple interfaces (data + callbacks) to keep components declarative.
    - Services (`src/services/`) provide API clients and helpers; components remain focused on rendering and user interaction.
    - Communication between sibling components is achieved by lifting state into shared parents or via contextual providers when broader scope is required.
    - Tests and Storybook-style examples (if present) should exercise components in isolation and composed states.

## CI Workflows

Four developer-facing workflows run in GitHub Actions:

- Unit tests: `.github/workflows/unit-tests.yml`
    - Installs dependencies with `npm ci`
    - Runs Jest unit tests with coverage output
    - Uploads coverage HTML report artifacts
- UI tests: `.github/workflows/ui-tests.yml`
    - Installs dependencies with `npm ci`
    - Installs Playwright browsers
    - Runs `npm run test:ui`
    - Uploads Playwright report artifacts
- Lint: `.github/workflows/linter.yml`
    - Installs dependencies with `npm ci`
    - Runs `npm run lint`
    - Checks Prettier formatting with `npx prettier --check`
- Build: `.github/workflows/Build.yml`
    - Installs dependencies
    - Runs TypeScript type check (`npx tsc --noEmit`)
    - Runs `npm run build`

Why this split exists:

- Clear PR checks (`unit-tests`, `ui-tests`, `lint`, and `build` appear separately)
- Faster diagnosis when only one validation layer fails
- Easier branch protection rules per check type

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
npm run build
npm run test
npm run test:ui
```

Recommended strict validation before opening or updating a PR:

```bash
npm run lint && npm run build && npm test -- --runInBand
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
