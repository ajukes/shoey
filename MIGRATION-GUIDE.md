# RulesProfile Migration Guide

This guide walks you through migrating from team-based rules to the new club-based RulesProfile system with dual point tracking.

## Overview

The new system:
- **Rules**: Global rules (no longer team-specific)
- **RulesProfile**: Club-level rule configurations with custom points
- **Teams**: Reference a rules profile (defaults to club's default profile)
- **Dual Points**: Each game generates both TEAM and CLUB points per player

## Migration Steps

### Step 1: Update Schema (Add New Tables) ✅ COMPLETED
The schema has been updated with:
- `RulesProfile` model
- `RulesProfileRule` junction table
- `PointType` enum
- Updated `PlayerGameRulePoints` for dual tracking

### Step 2: Apply Schema Changes (SAFE)
```bash
npx prisma db push
```
This adds the new tables without affecting existing data.

### Step 3: Migrate Data
```bash
node scripts/rules-profile-migration.js --migrate
```
This script will:
1. Create backup of existing data
2. Create default rules profiles for each club
3. Convert team-specific rules to global rules
4. Link teams to their club's default profile
5. Prepare for dual point tracking

### Step 4: Generate Dual Points (Manual Step)
After the schema is fully updated, run a script to:
1. Duplicate existing `PlayerGameRulePoints` records
2. Create CLUB point versions alongside existing TEAM points
3. Link both to appropriate profiles

### Step 5: Verify Migration
```bash
node scripts/verify-migration.js
```

## Data Transformation Details

### Rules Migration
- **Before**: `Rule.teamId` → specific to one team
- **After**: Global rules + `RulesProfileRule` with custom points per club

### Point Tracking Migration
- **Before**: One point record per player/game/rule
- **After**: Two point records (TEAM + CLUB) per player/game/rule

### Team Configuration
- **Before**: Teams inherit rules implicitly
- **After**: Teams reference a `RulesProfile` (defaults to club default)

## Example Data Flow

### Before Migration
```
Team "BHHC 6s" → Rules [Goal=10pts, Assist=5pts]
Game → Player scores 2 goals → 20pts (Team leaderboard only)
```

### After Migration
```
Club "Brighton HC" → Default Profile [Goal=5pts, Assist=3pts]
Team "BHHC 6s" → "Super Comp" Profile [Goal=10pts, Assist=5pts]
Game → Player scores 2 goals → 20pts (Team) + 10pts (Club)
```

## Safety Features

1. **Data Backup**: Automatic backup before any changes
2. **Incremental**: Can pause/resume at each step
3. **Verification**: Scripts to validate migration success
4. **Rollback**: Backup data can restore original state

## Risk Assessment

- **Low Risk**: Adding new tables (Step 2)
- **Medium Risk**: Data transformation (Step 3)
- **High Risk**: Schema changes to existing tables (Step 4)

## Recovery Plan

If migration fails:
1. Restore from automatic backup
2. Review error logs
3. Fix schema if needed
4. Re-run migration scripts

## Post-Migration Benefits

1. **Consistent Club Stats**: All players comparable within club
2. **Flexible Team Rules**: Teams can customize without affecting club stats
3. **Historical Accuracy**: Existing points preserved and enhanced
4. **Future Scalability**: Easy to add new rule profiles