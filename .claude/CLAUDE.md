# Shoey - Hockey Team Management Application

## Application Overview

**Shoey** is a comprehensive hockey team management system built with Next.js, TypeScript, Prisma, and PostgreSQL. The application manages clubs, teams, leagues, players, games, and performance tracking with a sophisticated role-based access control system.

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **UI**: Custom glass-morphism design system

## Database Schema & Relationships

### Core Entities

#### User & Authentication
- **User**: NextAuth user accounts
- **Player**: Game participants linked to users (Player.userId → User.id)
- **Roles**: ADMIN, MANAGER, CAPTAIN, PLAYER

#### Organizational Structure
- **Club**: Top-level organization that owns teams
- **Team**: Belongs to one club, can participate in multiple leagues
- **League**: Independent entities with start/end dates, belong to seasons
- **Season**: Groups leagues by year ("2025/26")

#### Game Management
- **Game**: Matches between teams with stats and scoring
- **GamePlayer**: Junction table for squad selection (many-to-many)
- **GamePlayerStats**: Individual player performance in games
- **PlayerGameRulePoints**: Points awarded based on rules

#### Rules & Scoring
- **Rule**: Team-specific rules for point calculation
- **RuleCondition**: Conditions for automatic rule application
- **CustomVariable**: Team-specific metrics

### Key Relationships

```
Season → League (one-to-many)
Club → Team (one-to-many)
Team ↔ League (many-to-many via TeamLeague junction)
Player → Club (many-to-one)
Player → Team (many-to-one, represents preferred team)
Game → Team (many-to-one)
Game ↔ Player (many-to-many via GamePlayer junction for squad selection)
```

## Role-Based Access Control

### User Roles & Permissions

#### ADMIN (juk3sie@gmail.com auto-assigned)
- **View**: All games, clubs, teams, leagues everywhere
- **Administer**: Everything - full CRUD on all entities
- **Special**: Can delete games, assign admin roles

#### MANAGER (club-level management)
- **View**: All games for teams in their club
- **Administer**:
  - Games for any team in their club
  - Teams within their club
  - Player management for their club
- **Cannot**: Access other clubs' data

#### CAPTAIN (team-level management)
- **View**: All games for teams in their club
- **Administer**:
  - Games for their preferred team only (Player.teamId)
  - Squad selection for their team's games
  - Player invitations to their team
- **Cannot**: Administer other teams' games (even in same club)

#### PLAYER (basic access)
- **View**:
  - All games for teams in their club
  - "Club Games" vs "My Games" filtering
  - Personal statistics and performance
- **Administer**: None
- **Cannot**: Create, edit, or delete any entities

### Authentication Flow

1. **User Registration**: Users cannot login until a Player record exists with matching email
2. **Player Creation**: CAPTAIN/MANAGER/ADMIN can create Player records
3. **Auto-ADMIN**: juk3sie@gmail.com automatically gets ADMIN role on first login
4. **Session Context**: User session includes player role, club, and preferred team data

## Game Management Workflows

### Game Creation by Role

#### MANAGER Workflow
1. Select any league their club's teams participate in
2. Select any team from their club (filtered by league)
3. Squad selection (prioritize frequent players)
4. Validation: No overlapping games (same team, same date)

#### CAPTAIN Workflow
1. Auto-select their preferred team (Player.teamId)
2. Filter active leagues for that team (date-based)
3. Auto-select league if only one active
4. Squad selection (prioritize players from preferred team)
5. Same validation as MANAGER

### Game States & Transitions
- **SCHEDULED** → **IN_PROGRESS** → **COMPLETED**
- **CANCELLED** (terminal state)
- Only CAPTAIN/MANAGER can transition states
- ADMIN can force any state transition

### Squad Management
- **GamePlayer junction table** tracks squad selection
- **Preferred team** (Player.teamId) prioritizes player suggestions
- Squad can be edited until game completion
- Frequent/recent players shown first in selection

## Game Completion Wizard

### Multi-Step Process
1. **Game Stats**: Enter goalsFor, goalsAgainst, set status to COMPLETED
2. **Player Stats**: Goals, assists, cards, saves, tackles, passes for each squad member
3. **Rule Application**:
   - Automatic rule evaluation based on conditions
   - Manual rule point assignment
   - Notes and overrides

### Rule System
- **Global Rules**: Created by ADMIN, stored in central table
- **Team Rules**: CAPTAIN/MANAGER reference global rules for their team
- **Automatic Calculation**: Triggered when game stats entered
- **Manual Override**: CAPTAIN/MANAGER/ADMIN can assign additional points
- **Future Only**: Rule changes only affect new games

## League & Season Management

### Active League Detection
- Leagues have startDate and endDate
- "Active" = current date within date range
- Used for auto-selection in game creation

### Season Structure
- **Season** groups multiple leagues
- Format: "2025/26"
- Determines statistics accumulation periods
- Leaderboards filtered by season

### Team-League Relationships
- Teams can participate in multiple leagues simultaneously
- No cross-club restrictions (teams from different clubs can compete)
- Junction table tracks relationships without additional metadata

## Leaderboards & Statistics

### Scope & Filtering
- **Club-based**: Players aggregated across all teams in their club
- **Season-based**: Stats reset/grouped by season
- **Rule-driven**: All player rankings based on rule points, not raw stats

### Player Performance
- Individual stats tracked per game
- Rule points calculated automatically and manually
- Club leaderboard aggregates across all teams
- "My Games" vs "Club Games" filtering for players

## UI/UX Design Principles

### Role-Based Interface
- Show only applicable actions based on user permissions
- Display user context (club, preferred team) in header
- Progressive disclosure based on role capabilities

### Glass-Morphism Design
- Custom component library (GlassCard, GlassButton, etc.)
- Consistent visual hierarchy
- Mobile-responsive navigation

### Navigation Structure
- **ADMIN**: Full navigation to all sections
- **MANAGER**: Club-focused navigation
- **CAPTAIN**: Team-focused with club visibility
- **PLAYER**: Consumption-focused interface

## Implementation Priority

### Phase 1: Foundation (Database & Auth)
1. Schema migrations (Season, TeamLeague, GamePlayer)
2. Session integration with role-based context
3. API middleware for permission filtering
4. Auto-ADMIN assignment

### Phase 2: Core Game Management
1. Role-based game creation workflows
2. Enhanced squad selection
3. Game completion wizard
4. Rule application system

### Phase 3: UI/UX Enhancement
1. Role-aware interface elements
2. Permission-based action visibility
3. Club/My Games filtering
4. Enhanced mobile experience

## Validation Rules

### Business Logic Constraints
- One game per team per day
- Squad selection from club players only
- League participation requires active league
- CAPTAIN can only administer preferred team games
- Rule changes only affect future games

### Technical Validations
- User must have Player record to access system
- Session verification on all protected routes
- Role-based API filtering on all endpoints
- Proper cascade deletes for data integrity

## Key Files & Components

### Database
- `prisma/schema.prisma` - Complete data model
- `prisma/migrations/` - Schema evolution

### Authentication
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/components/providers/SessionProvider.tsx` - Session context
- `src/types/next-auth.d.ts` - Session type extensions

### Game Management
- `src/app/games/page.tsx` - Main games interface
- `src/components/games/GameManagement.tsx` - Game CRUD
- `src/components/games/GameDetails.tsx` - Game view/stats
- `src/app/api/games/route.ts` - Games API

### UI Components
- `src/components/ui/` - Glass-morphism component library
- `src/components/layout/MainLayout.tsx` - App shell
- `src/components/layout/MobileNavigation.tsx` - Navigation

This architecture provides a scalable, role-aware team management system that adapts to each user's context and permissions while maintaining data security and business logic integrity.

## Recent Technical Updates & Fixes

### Database Setup & Seeding (Sept 19, 2025)
- **Current Data**: Brighton & Hove Hockey Club with BHHC Mens 6s and BHHC Mens 4s teams
- **Season**: 2025/26 with "South East Mens Division 2 Martlets" league
- **Players**:
  - Antony Jukes (juk3sie@gmail.com) - ADMIN, ATT position, BHHC Mens 6s
  - Jamie Morris (Jamie.e.l.morris@gmail.com) - CAPTAIN, DEF position, BHHC Mens 6s
  - Nathan Thorley (Nathan.thorley4@gmail.com) - MANAGER, MID position, BHHC Mens 4s
- **Sample Game**: Sept 20th vs Eastbourne 3s with Jamie in squad

### Critical API Fixes
1. **Teams API**: Added league relationships via `teamLeagues` junction table
2. **Leagues API**: Fixed count queries to use `teamLeagues` instead of direct `teams` relationship
3. **Players API**: Added missing PUT method for player updates with Next.js 15 compatibility
4. **Games API**: Fixed DELETE handler to avoid middleware signature conflicts

### Next.js 15 Compatibility
- **Route Parameters**: All `[id]` routes now use `params: Promise<{ id: string }>` pattern
- **Async Parameter Access**: All `params` usage wrapped with `await params`
- **Middleware Issues**: Simplified authentication in DELETE handlers to avoid Promise conflicts

### OAuth Authentication Setup
- **Google OAuth**: Configured with `allowDangerousEmailAccountLinking: true`
- **User Linking**: Automatic linking of existing Player records to OAuth accounts
- **NEXTAUTH_URL**: Currently set to `http://localhost:3002` (development server)

### UI/UX Improvements
- **Mobile Responsive Players Page**:
  - Compact stats cards with horizontal layout on mobile
  - Enhanced GlassTable with improved mobile card view
  - Touch-friendly interface with proper spacing and truncation
- **Stats Grid**: Optimized for mobile with 2x2 grid and smaller icons/padding

### Development Environment
- **Server**: Running on port 3002 (http://localhost:3002)
- **Database**: Neon PostgreSQL with proper schema migrations applied
- **Prisma Studio**: Available on port 5555 for database management

### Known Working Features
- ✅ Player management (CRUD operations)
- ✅ Team-league relationships
- ✅ Game deletion (ADMIN only)
- ✅ Mobile responsive design
- ✅ OAuth authentication with Google
- ✅ Role-based access control

### Development Commands
```bash
npm run dev          # Start development server
npx prisma generate  # Regenerate Prisma client
npx prisma db push   # Apply schema changes
npm run db:seed      # Seed database with Brighton & Hove Hockey Club data
npx prisma studio    # Open Prisma Studio
```