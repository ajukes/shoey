#!/usr/bin/env ts-node

/**
 * Migration Script: Add RulesProfile System
 *
 * This script safely migrates the existing team-based rules system
 * to the new club-based RulesProfile system with dual point tracking.
 *
 * Usage:
 *   npx ts-node scripts/migrate-rules-profiles.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting RulesProfile migration...');

  try {
    // Step 1: Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'prisma', 'manual-migration-rules-profiles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Step 2: Create a backup
    console.log('📦 Creating backup of current data...');
    await createDataBackup();

    // Step 3: Execute the migration
    console.log('🚀 Executing migration...');
    await prisma.$executeRawUnsafe(migrationSQL);

    // Step 4: Verify the migration
    console.log('✅ Verifying migration results...');
    await verifyMigration();

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('🔄 You can restore from backup if needed.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createDataBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Export current rules data
  const rules = await prisma.rule.findMany({
    include: {
      conditions: true,
      gameRulePoints: true
    }
  });

  const teams = await prisma.team.findMany({
    include: {
      club: true
    }
  });

  const gameRulePoints = await prisma.playerGameRulePoints.findMany();

  const backupData = {
    timestamp,
    rules,
    teams,
    gameRulePoints,
    metadata: {
      rulesCount: rules.length,
      teamsCount: teams.length,
      gameRulePointsCount: gameRulePoints.length
    }
  };

  const backupFile = path.join(backupDir, `rules-backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

  console.log(`📁 Backup created: ${backupFile}`);
  return backupFile;
}

async function verifyMigration() {
  // Check that new tables exist and have data
  const rulesProfilesCount = await prisma.rulesProfile.count();
  const rulesProfileRulesCount = await prisma.rulesProfileRule.count();
  const teamPointsCount = await prisma.playerGameRulePoints.count({
    where: { pointType: 'TEAM' }
  });
  const clubPointsCount = await prisma.playerGameRulePoints.count({
    where: { pointType: 'CLUB' }
  });
  const teamsWithProfiles = await prisma.team.count({
    where: { defaultRulesProfileId: { not: null } }
  });

  console.log('\n📊 Migration Results:');
  console.log(`   Rules Profiles created: ${rulesProfilesCount}`);
  console.log(`   Profile Rules created: ${rulesProfileRulesCount}`);
  console.log(`   TEAM point records: ${teamPointsCount}`);
  console.log(`   CLUB point records: ${clubPointsCount}`);
  console.log(`   Teams with default profiles: ${teamsWithProfiles}`);

  // Validation checks
  if (rulesProfilesCount === 0) {
    throw new Error('No rules profiles were created');
  }

  if (teamPointsCount !== clubPointsCount) {
    console.warn(`⚠️  Warning: TEAM points (${teamPointsCount}) != CLUB points (${clubPointsCount})`);
  }

  console.log('✅ Migration verification passed');
}

// Export the backup creation function for standalone use
export { createDataBackup };

// Run the migration if this script is executed directly
if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => process.exit());
}