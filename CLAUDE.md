# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Context

This is the NEW frontend application for the Hensei system - a Granblue Fantasy team/party management platform. It is a SvelteKit rewrite of the existing Next.js application.

### System Components:
- **hensei-svelte** (this repository): New SvelteKit frontend (actively being developed)
- **hensei-web** (../hensei-web): Current Next.js frontend (being migrated from)
- **hensei-api** (../hensei-api): Rails API backend that provides all data and authentication
- **siero-bot**: Discord bot (separate repository)

## Development Commands

### Frontend (hensei-svelte)
```bash
# Install dependencies (using pnpm)
pnpm install

# Development server (Vite + SvelteKit)
pnpm dev              # Start dev server on default port

# Build & Production
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm check            # Type-check with svelte-check
pnpm check:watch      # Type-check in watch mode
pnpm lint             # Run Prettier and ESLint
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run all tests once
pnpm test:unit        # Run tests with Vitest (watch mode)

# Storybook
pnpm storybook        # Start Storybook on port 6006
pnpm build-storybook  # Build Storybook for production
```

### Backend API (hensei-api)
```bash
cd ../hensei-api

# Install dependencies
bundle install

# Database
rails db:create       # Create database
rails db:migrate      # Run migrations
rails db:seed         # Seed database

# Development
rails server          # Start API server (port 3000)
rails console         # Rails console

# Testing
bundle exec rspec     # Run test suite

# Code Quality
bundle exec rubocop   # Ruby linter

# Background Jobs
bundle exec sidekiq   # Start background job processor
```

## Migration Status

### Overview
This SvelteKit application (hensei-svelte) is a complete rewrite of the existing Next.js application (hensei-web). The migration is currently in progress.

### Migrated Features ✅
- **Routes**:
  - `/about` - About page
  - `/auth` - Authentication flow
  - `/teams` - Team listing and management
  - `/party` - Party-related pages
  - `/collection` - Collection management
  - `/login` - Login page
  - `/me` - User profile
  - `/[username]` - User profiles

- **Components**:
  - Character, Weapon, Summon units (basic versions)
  - Grid components (GridRep)
  - Party components
  - Navigation component
  - Button and Icon components

### Not Yet Migrated ❌
- **Routes** (from hensei-web):
  - `/new` - New party creation workflow
  - `/p` - Party permalink/sharing
  - `/saved` - Saved parties
  - `/roadmap` - Roadmap page
  - `/updates` - Updates/changelog page
  - Error pages (server-error, unauthorized)

- **Components** (from hensei-web):
  - Full modal systems (CharacterModal, WeaponModal, SummonModal)
  - Conflict resolution modals
  - Hovercards (CharacterHovercard, WeaponHovercard, SummonHovercard)
  - Search and filter bars
  - Job system components
  - Mastery components
  - Raid selection components
  - Rich text editor (TipTap integration)
  - Various dialogs and common components

### Key Differences in Implementation
- **State Management**: Migrating from Valtio (Next.js) to TanStack Query (SvelteKit)
- **Styling**: Both use SCSS modules, but component structure differs
- **i18n**: Migrating from next-i18next to Paraglide.js
- **Routing**: From Next.js App Router to SvelteKit file-based routing
- **Components**: From React to Svelte 5 with runes

## Architecture Overview

### System Architecture

The Hensei system consists of multiple components:

1. **hensei-svelte** (this repository): New SvelteKit frontend (in development)
2. **hensei-web** (../hensei-web): Current Next.js 14 frontend (being replaced)
   - React 18 with TypeScript
   - Radix UI components
   - Valtio for state management
   - TipTap for rich text editing
   - SCSS modules for styling
3. **hensei-api** (../hensei-api): Rails API backend
   - Ruby 3.3.7 + Rails 8.0.1
   - PostgreSQL with full-text search
   - OAuth2 authentication (Doorkeeper)
   - AWS S3 for image storage
   - Sidekiq for background jobs
   - Blueprinter for JSON serialization

### Frontend Tech Stack
- **Framework**: SvelteKit with Svelte 5
- **Build Tool**: Vite 7
- **Language**: TypeScript with strict mode enabled
- **Package Manager**: pnpm (10.15.1)
- **Styling**: SCSS with CSS Modules pattern
- **Testing**: Vitest with browser testing (Playwright)
- **Internationalization**: Paraglide.js with English and Japanese support
- **UI Components**: Bits UI library
- **Data Fetching**: TanStack Query for Svelte
- **Deployment**: Node adapter for server deployment

### Project Structure

```
src/
├── routes/              # SvelteKit file-based routing
│   ├── [username]/      # Dynamic user profile routes
│   ├── auth/            # Authentication flows
│   ├── teams/           # Team management pages
│   ├── party/           # Party-related pages
│   └── collection/      # Collection management
├── lib/
│   ├── api/             # API client layer
│   │   ├── core.ts      # API client core functionality
│   │   ├── resources/   # Resource-specific API calls (parties, users, etc.)
│   │   └── schemas/     # Zod schemas for API responses
│   ├── components/      # Reusable Svelte components
│   │   ├── units/       # Unit components (Character, Weapon, Summon)
│   │   ├── reps/        # Representation components
│   │   ├── grids/       # Grid layout components
│   │   ├── party/       # Party-specific components
│   │   └── panels/      # Panel components
│   ├── auth/            # Authentication utilities
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── validation/      # Input validation schemas
│   └── paraglide/       # Generated i18n files
├── themes/              # SCSS theme files
└── assets/              # Static assets
```

### Key Architectural Patterns

1. **Component Organization**: Components are organized by domain (units, reps, grids, etc.) with each having its own module structure.

2. **API Layer**: Centralized API client in `lib/api/` with resource-specific modules and Zod schema validation.

3. **Type Safety**: Strict TypeScript configuration with additional safety flags enabled (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).

4. **Internationalization**: Uses Paraglide.js with message files in `messages/` directory, supporting English and Japanese locales.

5. **Testing Strategy**: Dual testing approach with browser tests for Svelte components and Node tests for server-side code.

6. **Path Aliases**:
   - `$lib/*` → `src/lib/*` (SvelteKit default)
   - `$types` → `src/lib/types` (custom alias)
   - `$src` → `src/` (Vite alias)

### Component Patterns

Components follow a consistent structure:
- `.svelte` file for component logic
- `.module.scss` for scoped styles (when needed)
- TypeScript for type safety
- Props validation with Zod schemas where applicable

### API Integration

The frontend communicates with hensei-api (Rails backend) for:
- **Authentication**: OAuth2 via Doorkeeper (`/oauth/token`)
- **Party Management**: CRUD operations on party configurations
- **Grid Management**: Managing characters, weapons, and summons in parties
- **User Management**: Profile updates, username/email availability checks
- **Favorites**: Managing favorite parties
- **Jobs**: Job selection and skill management
- **Search**: Full-text search across game data
- **Raids & Guidebooks**: Game content categorization

Key API patterns:
- All endpoints require Bearer token authentication
- Responses use Blueprinter serialization
- Base path: `/api/v1/`
- Image assets served from AWS S3

### Domain Models (from hensei-api)

Key models that the frontend interacts with:
- **Party**: Team configurations with characters, weapons, summons, job, and skills
- **Character/Weapon/Summon**: Game items with various attributes and enhancements
- **GridCharacter/GridWeapon/GridSummon**: Junction tables for party composition
- **User**: Authentication and party ownership
- **Job/JobSkill/JobAccessory**: Player job system
- **Raid/RaidGroup**: Content categorization
- **Awakening/WeaponKey**: Item enhancement systems
- **Favorite**: User's bookmarked parties
- **Guidebook**: Game strategy guides

### Testing Configuration

Vitest is configured with two test projects:
- **Client tests**: Browser-based tests for Svelte components using Playwright
- **Server tests**: Node-based tests for server-side logic

Tests should follow the pattern `*.{test,spec}.{js,ts}` for server tests and `*.svelte.{test,spec}.{js,ts}` for component tests.