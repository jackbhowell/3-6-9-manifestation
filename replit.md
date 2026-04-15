# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### 3-6-9 Manifestation Companion (Mobile App)
- **Directory**: `artifacts/manifestation-app`
- **Type**: Expo (React Native)
- **Preview path**: `/`
- **Description**: A calming mobile app for the 3-6-9 Tesla manifestation method. Users write affirmations 3 times in the morning, 6 in the afternoon, and 9 in the evening over a 33 or 45-day cycle.

#### Features
- Onboarding with cycle length selection (33 or 45 days), personal intention setting, and notification time setup
- Today screen with editable journey name (tap to rename), session countdown timers, streak counter
- Affirmation screens with 3/6/9 dynamic input fields (enforced completion order, route-level guards)
- Reflection screen with 60-second animated pulsing timer and 528Hz chime
- Manifest tab: personal list of things to call in, checkable as received
- Journeys tab: list of active and archived journeys with progress stats; tapping opens journey detail
- Learn tab: calm/cosmic accordion explainer of the 3-6-9 method and Tesla's numbers
- Settings tab: edit notification times, toggle notifications, start a new journey
- Daily push notifications via expo-notifications (with HH:MM validation)
- Local persistence via AsyncStorage (settings, progress, manifest items, archived journeys)
- Haptic feedback on session completion
- Deep indigo/violet gradient design
- Bottom nav: Manifest | Journeys | Learn | Settings (Home tab hidden — Today accessible via Journeys)

#### Screens
- `app/onboarding.tsx` — 4-step onboarding flow
- `app/(tabs)/index.tsx` — Today/practice dashboard (hidden from tab bar)
- `app/(tabs)/manifest.tsx` — Manifest wishlist
- `app/(tabs)/journeys.tsx` — Journeys list
- `app/(tabs)/learn.tsx` — 3-6-9 explainer
- `app/(tabs)/settings.tsx` — Settings and notification controls
- `app/affirmation.tsx` — Session affirmation entry
- `app/reflection.tsx` — 60-second breathing timer
- `app/journey-detail.tsx` — Day-by-day view of an archived journey
- `app/progress.tsx` — Full cycle progress (legacy, accessible from home)

#### Key Utilities
- `utils/storage.ts` — AsyncStorage CRUD for settings and progress
- `utils/notifications.ts` — Expo Notifications scheduling
- `context/AppContext.tsx` — Global app state with React Context
- `constants/colors.ts` — Custom dark indigo/violet theme tokens

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
