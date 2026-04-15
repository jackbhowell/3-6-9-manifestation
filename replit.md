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
- Home screen with day counter, session progress, streak counter
- Affirmation screens with 3/6/9 dynamic input fields (enforced completion order)
- Reflection screen with 60-second animated pulsing timer
- Progress screen showing full cycle completion history
- Daily push notifications via expo-notifications
- Local persistence via AsyncStorage
- Haptic feedback on session completion
- Deep indigo/violet gradient design

#### Screens
- `app/onboarding.tsx` — 4-step onboarding flow
- `app/(tabs)/index.tsx` — Home dashboard
- `app/affirmation.tsx` — Session affirmation entry
- `app/reflection.tsx` — 60-second breathing timer
- `app/progress.tsx` — Full cycle progress view

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
