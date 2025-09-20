- Also for each management view, we need to filter based on the PLAYER role. If ADMIN manage everything, if MANAGER OR CAPTAIN, they can view leagues the CLUB belongs to, their own CLUB and TEAMS the CLUB owns. Also RULES are defined globally by ADMIN role but each CAPTAIN or MANAGER can select which RULES it wants to apply for each of its GAME and PLAYER stats. Each PLAYER performance contributes to the TEAM leaderboard it plays for. But also I want a PLAYER leaderboard for the CLUB?
- Actually CAPTAIN autoselects TEAM and provides a list of LEAGUE to select from that the TEAM belongs to. TEAMS can belong to many teams?
- MANAGER when creating a GAME, selects the LEAGUE which then filters available TEAMS. CAPTAIN when creating a GAME has TEAM and LEAGUE auto selected.
- When creating GAMES, Managers can create GAMES and select the any LEAGUE the player CLUB belongs to. They can select any TEAMS that belong to the player CLUB. CAPTAINS belong to a TEAM, so the active LEAGUE and TEAM should be auto filled and non editable when they create a GAME. Actually, selecting or auto selecting a TEAM for a GAME should actually auto select the current active league the TEAM belongs to.
- There is also an ADMIN role which can be assigned. Automatically assign it for juk3sie@gmail.com. ADMIN can carry out all actions.

## RulesProfile System Implementation Status (Sept 20, 2025)

### ✅ Completed Features:
1. **Database Schema Updates**: Updated Prisma schema with RulesProfile models, dual point tracking (TEAM vs CLUB), and variable-to-variable comparisons
2. **Global Rules System**: Rules are now global (not team-specific) with club-level RulesProfile customization
3. **Dual Point Calculation**: PlayerGameRulePoints now tracks both TEAM and CLUB points with PointType enum
4. **Variable-to-Variable Comparisons**: Rules can compare variables (e.g., goalsFor > goalsAgainst for team wins)
5. **Position-Specific Rules**: Support for position-based conditions (different points for defenders vs strikers scoring)
6. **Rules Engine**: Enhanced rules-engine.ts with proper condition evaluation for all new features
7. **API Endpoints**: Complete CRUD operations for rules, variables, and rules profiles
8. **UI Components**: Fixed RuleBuilder component with proper condition UI, comparison toggles, and position dropdowns
9. **Game Completion Workflow**: Complete game completion modal with dual point calculation

### ✅ Technical Fixes Applied:
1. **Syntax Error Resolution**: Fixed complex nested ternary JSX parsing issues in RuleBuilder.tsx
2. **Turbopack Compatibility**: Resolved TypeScript compilation errors and cache issues
3. **Compare To Selector**: Fixed defaulting to "Static Value" instead of "Another Variable"
4. **Condition Persistence**: Rule conditions now properly retain saved state when editing
5. **Position Mapping**: Proper position value conversion between string enum and integer storage

### 📁 Key Files Modified:
- `prisma/schema.prisma` - RulesProfile models, dual tracking, compareVariable field
- `src/types/rules.ts` - Position mapping, variable definitions, compareVariable support
- `src/lib/rules-engine.ts` - Enhanced condition evaluation with variable comparisons
- `src/components/rules/RuleBuilder.tsx` - Complete UI overhaul with proper condition handling
- `src/app/api/rules/[id]/route.ts` - Individual rule CRUD operations
- `src/app/api/games/[id]/complete/route.ts` - Game completion with dual point calculation
- `src/components/games/GameCompletionModal.tsx` - Comprehensive completion workflow

### 🎯 Current Functionality:
- **Game Completion**: Navigate to Games page → Find IN_PROGRESS game → Click green checkmark "Complete Game" button
- **Rule Creation**: Create rules with position-specific conditions and variable-to-variable comparisons
- **Rules Profile Management**: Club-level customization of global rules
- **Dual Leaderboards**: Automatic calculation of both TEAM and CLUB points
- **Real-time Rule Application**: Automatic and manual rule point assignment during game completion

### 📋 Next Steps:
- Create club and team leaderboard views to display the dual point system
- Test end-to-end game completion and point calculation workflow
- Add rule testing/preview functionality for new rules

### 🚀 Testing Position Rules:
Run the test script: `node scripts/test-position-rules.js` to verify position-based rule logic.

## Development Server Management

- **User manages their own development server** - Do not start, stop, or manage npm run dev or other server processes
- **User handles database tools** - Do not run Prisma Studio or other database management tools unless explicitly requested
- **Focus on code assistance only** - Provide code help, debugging, and file modifications without server management