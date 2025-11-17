# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Hive Witness Directory** - a full-stack web application for viewing and interacting with Hive blockchain witnesses. The app provides real-time witness data, network statistics, and blockchain voting through Hive Keychain integration.

## Development Commands

### Running the Application
```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production (frontend + backend)
npm run start      # Start production server
npm run check      # TypeScript type checking
```

### Database Commands
```bash
npm run db:push    # Push Drizzle schema to PostgreSQL
```

### Important Notes
- Development server runs on port 5000 (NOT configurable - Replit restriction)
- The server serves both API and static assets
- Database is PostgreSQL but currently uses in-memory storage for development
- Hot reload is enabled via Vite in development

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js with TypeScript (ES modules)
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query for server state, React Context for app state
- **Routing**: Wouter (lightweight client-side routing)

### Directory Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── api/           # Hive blockchain API integration
│   │   ├── components/    # React components (shadcn/ui based)
│   │   ├── context/       # KeychainContext, LanguageContext
│   │   ├── hooks/         # Custom React hooks (useWitnesses, useNetworkStats)
│   │   ├── pages/         # Route components (Home, Witnesses, UserStats, WitnessProfile)
│   │   └── lib/           # Utilities and helpers
│   └── index.html         # HTML entry point
├── server/                # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # In-memory storage (development)
│   └── vite.ts           # Vite dev server setup
├── shared/               # Shared code between client/server
│   └── schema.ts         # Drizzle database schema
└── attached_assets/      # Static assets/images
```

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Key Components and Systems

#### Authentication Flow
- **Primary**: Hive Keychain browser extension for secure authentication
- **Fallback**: Development mode with mock authentication (no Keychain required)
- **Storage**: localStorage for session persistence with background refresh
- **Multi-Account**: Users can save/switch between multiple Hive accounts
- User data stored in `localStorage` under key `hive_current_user`

#### Blockchain Integration (`client/src/api/hive.ts`)
- **Multiple API endpoints** for redundancy: api.hive.blog, beacon.peakd.com
- **Best node selection**: Automatically finds 100% score nodes
- **VESTS to HP conversion**: Cached globally, auto-calculated from network properties
- **Polling intervals**: Network stats update every 30 seconds (reduced from 3s for performance)
- All Hive API calls use JSON-RPC 2.0 format

#### Context Providers (in order)
1. `ErrorBoundary` - App-wide error handling
2. `QueryClientProvider` - TanStack Query
3. `KeychainProvider` - Authentication & blockchain transactions
4. `LanguageProvider` - Bilingual support (EN/ES)
5. `ThemeProvider` - Dark/light theme

#### Routing Structure
- `/` - Home page
- `/witnesses` - Witness directory/listing
- `/witness/:name` - Individual witness profile
- `/user-stats` - Current user stats (requires auth)
- `/:username` - Public user stats (no auth required)

### Data Flow Pattern
1. User loads app → Check localStorage for saved user → Silent background refresh
2. Witness data fetched → Cached by TanStack Query → Background updates every 30s
3. Vote action → Keychain confirmation → Broadcast to blockchain → Refresh user data
4. Best node selection → Cache node → Fallback to default if fails

## Development Guidelines

### TypeScript Configuration
- ES modules only (`"type": "module"` in package.json)
- Strict mode enabled
- Module resolution: `bundler`
- No emit (handled by Vite and esbuild)

### API Endpoint Pattern
All backend routes in `server/routes.ts` follow this pattern:
```typescript
app.get('/api/endpoint', async (req, res) => {
  try {
    // Hive API call
    const response = await fetch(hiveNode, {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: "2.0", method: "...", params: [] })
    });
    res.json(data.result);
  } catch (error) {
    res.status(500).json({ error: 'Description' });
  }
});
```

### Frontend Patterns
- **Hooks first**: Use custom hooks (useWitnesses, useNetworkStats) for data fetching
- **TanStack Query**: All blockchain data fetching uses React Query with proper caching
- **Context sparingly**: Only for truly global state (auth, theme, language)
- **Cleanup required**: Always cleanup intervals/timers in useEffect

### Hive Blockchain Specifics
- **Usernames**: Always clean with `.replace('@', '').trim().toLowerCase()`
- **VESTS to HP**: Use global `vestToHpRatio` calculated from `total_vesting_fund_hive / total_vesting_shares`
- **Proxied power**: Use `proxied_vsf_votes` field directly (already in VESTS)
- **Governance power**: Own HP + Proxied HP (NOT Effective HP + Proxied HP)
- **Witness voting**: Maximum 30 witnesses per account

### UI Component Library
Uses shadcn/ui with Radix UI primitives. All components in `client/src/components/ui/`.

### Styling
- Tailwind CSS 4.x with @tailwindcss/vite plugin
- Dark/light mode via `next-themes`
- Theme configuration in `tailwind.config.ts` and `theme.json`

### Error Handling
- ErrorBoundary component wraps entire app
- All API calls have try-catch with fallback
- Production logging system in place
- Development mode shows detailed errors

## Database Schema

Currently configured for PostgreSQL (Neon) but using in-memory storage in development.

Schema location: `shared/schema.ts`

Tables:
- **users**: Basic authentication (id, username, password)

To push schema changes: `npm run db:push`

Environment variable required: `DATABASE_URL`

## Build Process

1. **Frontend build**: Vite bundles React app to `dist/public/`
2. **Backend build**: esbuild bundles server to `dist/index.js`
3. **Production**: Express serves static frontend + API endpoints

## Deployment

- **Platform**: Replit with autoscale deployment
- **Node version**: 20.x
- **Port**: Fixed at 5000 (Replit requirement)
- **Database**: PostgreSQL 16 provisioned via Replit
- **Environment**: Set NODE_ENV=production for prod builds

## Testing & Verification

- No test framework currently configured
- Manual testing required for all changes
- Verify Keychain integration in browser (not in headless mode)
- Check console logs for Hive API errors

## Common Pitfalls

1. **Double authentication**: Avoid multiple simultaneous Keychain requests
2. **Polling memory leaks**: Always cleanup intervals in useEffect
3. **Node caching**: Clear `cachedBestNode` if having API issues
4. **localStorage keys**: Use consistent keys (`hive_current_user`, not `user` or `currentUser`)
5. **String vs Number**: Hive API returns numbers as strings - parse before math operations
6. **Port conflicts**: Port 5000 is the only exposed port on Replit

## External Dependencies

### Critical
- **Hive Keychain**: Browser extension required for authentication/voting
- **keychain-sdk**: SDK for Keychain integration in code
- **Hive APIs**: api.hive.blog, beacon.peakd.com
- **@hiveio/wax**: Wax library for Hive blockchain (installed, migration pending)
- **@hiveio/wax-signers-keychain**: Wax Keychain signer (installed, migration pending)

### Optional
- **Neon Database**: PostgreSQL provider (DATABASE_URL env var)

## Future Migrations

### Wax Library Migration (Planned)

The project has Wax installed but still uses raw `fetch()` JSON-RPC calls. Migrating to Wax will provide:
- **Type-safe API calls**: Better IDE autocomplete and compile-time error checking
- **Cleaner code**: Replace manual JSON-RPC construction with method calls
- **Better error handling**: Built-in error handling and retries
- **Consistent API**: Use object-oriented patterns instead of raw responses

**Current approach:**
```typescript
const response = await fetch(apiNode, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "condenser_api.get_witnesses_by_vote",
    params: ["", 100],
    id: 1
  })
});
```

**With Wax (future):**
```typescript
const chain = await createHiveChain({ apiEndpoint: apiNode });
const witnesses = await chain.api.database_api.list_witnesses({
  start: "",
  limit: 100,
  order: "by_vote_name"
});
```

**Migration tasks:**
1. Replace `client/src/api/hive.ts` raw fetch calls with Wax methods
2. Update `server/routes.ts` to use Wax
3. Replace `keychain-sdk` with `@hiveio/wax-signers-keychain` in `KeychainContext`
4. Test all endpoints for API response structure differences

### HAFBE API (HAF Block Explorer API) - ACTIVE

**HAFBE API** (https://api.syncad.com/hafbe-api/) is a public REST API built on HAF SQL that provides indexed Hive blockchain data.

**Current usage in project:**
- Recent voting activity tracking
- Witness vote history with voter power details
- Real-time vote operations with timestamps
- Pagination support for large datasets

**Available endpoints used:**
- `/witnesses/{account-name}` - Witness details with rank, votes, feed data
- `/witnesses/{account-name}/voters` - List all voters with pagination
- `/witnesses/{account-name}/votes/history` - Complete vote history with HP data
- `/accounts/{account-name}` - Account details and balances
- `/accounts/{account-name}/proxy-power` - Proxy delegators and voting power

**Key features:**
- Vote operations include `vests`, `account_vests`, `proxied_vests`
- Accurate blockchain timestamps
- Pagination (100 items per page default)
- Total counts for data planning
- No API key required (public access)

**Implementation location:**
- `client/src/api/hive-hafsql.ts` - API client functions
- `client/src/hooks/useRecentActivity.ts` - React hooks
- `client/src/components/RecentActivity.tsx` - UI component

**Migration status:**
- Migrated from mahdiyari HAF SQL API to HAFBE API for better data quality
- Witness activity feed now shows voter HP and accurate timestamps
- Supports filtering by time ranges and voter accounts

### HAF SQL Integration (Future - Self-Hosted)

**HAF SQL** is a PostgreSQL application that provides indexed Hive blockchain data with SQL queries.

**What it enables:**
- Complex analytics queries (voting patterns, historical trends)
- Faster data retrieval for large datasets
- SQL-based searching across all operations
- Historical blockchain data analysis
- Custom queries beyond HAFBE API capabilities

**Requirements:**
- Self-hosted HAF database server (500GB+ storage)
- PostgreSQL connection from application
- Full blockchain sync (takes days/weeks initially)

**Use cases for this project:**
- "Show all users who voted for witnesses X, Y, and Z"
- "Track witness rank changes over time"
- "Analyze voting power distribution"
- "Find witnesses with declining vote trends"
- Complex multi-witness correlation analysis

**When to implement:**
After the witness directory is stable and you need advanced analytics beyond what HAFBE API provides. Running a HAF instance will also benefit your witness operations by providing direct blockchain data access.

## Changelog Location

See `replit.md` for detailed feature development history and bug fixes.
