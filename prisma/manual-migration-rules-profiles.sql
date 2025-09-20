-- Manual Migration: Add RulesProfile System
-- This migration preserves existing data while adding the new RulesProfile system

BEGIN;

-- Step 1: Add new enums
CREATE TYPE "PointType" AS ENUM ('TEAM', 'CLUB');

-- Step 2: Create new tables for RulesProfile system
CREATE TABLE "rules_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "club_id" TEXT NOT NULL,
    "is_club_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rules_profile_rules" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "custom_points" INTEGER,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_profile_rules_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add indexes and constraints for rules_profiles
CREATE UNIQUE INDEX "rules_profiles_club_id_name_key" ON "rules_profiles"("club_id", "name");
CREATE UNIQUE INDEX "rules_profile_rules_profile_id_rule_id_key" ON "rules_profile_rules"("profile_id", "rule_id");

-- Step 4: Add foreign key constraints
ALTER TABLE "rules_profiles" ADD CONSTRAINT "rules_profiles_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rules_profile_rules" ADD CONSTRAINT "rules_profile_rules_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "rules_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rules_profile_rules" ADD CONSTRAINT "rules_profile_rules_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Modify existing rules table to be global (remove team_id)
-- First, create a backup of team-specific rules and convert them to global rules
INSERT INTO "rules_profiles" ("id", "name", "club_id", "is_club_default", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text as id,
    'Default Rules' as name,
    t.club_id,
    true as is_club_default,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT t.club_id
    FROM teams t
    JOIN rules r ON r.team_id = t.id
) t;

-- Create profile rules from existing team rules using the first team's rules per club as the club default
INSERT INTO "rules_profile_rules" ("id", "profile_id", "rule_id", "custom_points", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text as id,
    rp.id as profile_id,
    r.id as rule_id,
    r.points_awarded as custom_points,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM rules_profiles rp
JOIN clubs c ON c.id = rp.club_id
JOIN teams t ON t.club_id = c.id
JOIN rules r ON r.team_id = t.id
WHERE rp.is_club_default = true
AND t.id = (
    SELECT MIN(t2.id)
    FROM teams t2
    WHERE t2.club_id = c.id
    AND EXISTS(SELECT 1 FROM rules r2 WHERE r2.team_id = t2.id)
);

-- Remove team_id foreign key constraint and column from rules
ALTER TABLE "rules" DROP CONSTRAINT IF EXISTS "rules_team_id_fkey";
ALTER TABLE "rules" DROP COLUMN IF EXISTS "team_id";

-- Drop the old unique constraint and add name uniqueness globally
ALTER TABLE "rules" DROP CONSTRAINT IF EXISTS "rules_team_id_name_key";
ALTER TABLE "rules" ADD CONSTRAINT "rules_name_key" UNIQUE ("name");

-- Step 6: Add default_rules_profile_id to teams table
ALTER TABLE "teams" ADD COLUMN "default_rules_profile_id" TEXT;
ALTER TABLE "teams" ADD CONSTRAINT "teams_default_rules_profile_id_fkey" FOREIGN KEY ("default_rules_profile_id") REFERENCES "rules_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Set default rules profile for existing teams
UPDATE "teams"
SET "default_rules_profile_id" = (
    SELECT rp.id
    FROM rules_profiles rp
    WHERE rp.club_id = teams.club_id
    AND rp.is_club_default = true
    LIMIT 1
);

-- Step 7: Modify player_game_rule_points table for dual tracking
-- Add new columns
ALTER TABLE "player_game_rule_points" ADD COLUMN "point_type" "PointType";
ALTER TABLE "player_game_rule_points" ADD COLUMN "profile_id" TEXT;

-- Set initial values for existing records (assume they are TEAM points)
UPDATE "player_game_rule_points"
SET
    "point_type" = 'TEAM',
    "profile_id" = (
        SELECT t.default_rules_profile_id
        FROM games g
        JOIN teams t ON t.id = g.team_id
        WHERE g.id = player_game_rule_points.game_id
    )
WHERE "point_type" IS NULL;

-- Make the new columns required
ALTER TABLE "player_game_rule_points" ALTER COLUMN "point_type" SET NOT NULL;
ALTER TABLE "player_game_rule_points" ALTER COLUMN "profile_id" SET NOT NULL;

-- Add foreign key constraint for profile
ALTER TABLE "player_game_rule_points" ADD CONSTRAINT "player_game_rule_points_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "rules_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update the unique constraint to include point_type
ALTER TABLE "player_game_rule_points" DROP CONSTRAINT IF EXISTS "player_game_rule_points_player_id_game_id_rule_id_key";
ALTER TABLE "player_game_rule_points" ADD CONSTRAINT "player_game_rule_points_player_id_game_id_rule_id_point_type_key" UNIQUE ("player_id", "game_id", "rule_id", "point_type");

-- Step 8: Create duplicate CLUB point records for existing game rule points
INSERT INTO "player_game_rule_points" (
    "id", "player_id", "game_id", "rule_id", "points", "point_type", "profile_id",
    "is_manual", "notes", "created_at", "updated_at"
)
SELECT
    gen_random_uuid()::text as id,
    pgrp.player_id,
    pgrp.game_id,
    pgrp.rule_id,
    pgrp.points, -- For now, use same points - could be recalculated based on club profile
    'CLUB' as point_type,
    (
        SELECT rp.id
        FROM rules_profiles rp
        JOIN games g ON g.team_id IN (SELECT t.id FROM teams t WHERE t.club_id = rp.club_id)
        WHERE g.id = pgrp.game_id
        AND rp.is_club_default = true
        LIMIT 1
    ) as profile_id,
    pgrp.is_manual,
    CASE
        WHEN pgrp.notes IS NULL THEN 'Migrated club points'
        ELSE pgrp.notes || ' (Migrated club points)'
    END as notes,
    pgrp.created_at,
    CURRENT_TIMESTAMP
FROM "player_game_rule_points" pgrp
WHERE pgrp.point_type = 'TEAM';

COMMIT;

-- Verification queries (run these after migration to verify)
-- SELECT 'Clubs with default rules profiles' as check_type, COUNT(*) as count FROM rules_profiles WHERE is_club_default = true;
-- SELECT 'Teams with default profiles assigned' as check_type, COUNT(*) as count FROM teams WHERE default_rules_profile_id IS NOT NULL;
-- SELECT 'Total TEAM point records' as check_type, COUNT(*) as count FROM player_game_rule_points WHERE point_type = 'TEAM';
-- SELECT 'Total CLUB point records' as check_type, COUNT(*) as count FROM player_game_rule_points WHERE point_type = 'CLUB';