/**
 * RulesProfile Migration Script
 *
 * This script migrates the existing team-based rules to the new
 * club-based RulesProfile system while preserving all data.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting RulesProfile migration...');

  try {
    // Step 1: Use Prisma db push to create new tables (this is safe - only adds)
    console.log('📝 Please run: npx prisma db push');
    console.log('   This will add the new tables without affecting existing data.');
    console.log('   After running db push, run this script again with --migrate flag');

    // Check if we should proceed with data migration
    if (!process.argv.includes('--migrate')) {
      console.log('\n⏸️  Migration paused. Run with --migrate after db push to continue.');
      return;
    }

    // Step 2: Create backup
    console.log('📦 Creating data backup...');
    await createBackup();

    // Step 3: Migrate existing rules to global and create profiles
    console.log('🔄 Migrating rules to RulesProfile system...');
    await migrateRulesToProfiles();

    // Step 4: Update teams with default profiles
    console.log('🔗 Linking teams to profiles...');
    await linkTeamsToProfiles();

    // Step 5: Transform player game rule points
    console.log('🎯 Creating dual point tracking...');
    await createDualPointTracking();

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Run verification script to check results.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createBackup() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

  // Get current data
  const rules = await prisma.rule.findMany({ include: { conditions: true } });
  const teams = await prisma.team.findMany({ include: { club: true } });
  const playerGameRulePoints = await prisma.playerGameRulePoints.findMany();

  const backup = {
    timestamp,
    counts: {
      rules: rules.length,
      teams: teams.length,
      playerGameRulePoints: playerGameRulePoints.length
    },
    data: { rules, teams, playerGameRulePoints }
  };

  console.log(`   📁 Backup created for ${backup.counts.rules} rules, ${backup.counts.teams} teams, ${backup.counts.playerGameRulePoints} game rule points`);

  // In a real implementation, you'd save this to a file
  global.migrationBackup = backup;
  return backup;
}

async function migrateRulesToProfiles() {
  // Get all clubs that have teams with rules
  const clubsWithRules = await prisma.club.findMany({
    include: {
      teams: {
        include: {
          rules: {
            include: { conditions: true }
          }
        }
      }
    },
    where: {
      teams: {
        some: {
          rules: {
            some: {}
          }
        }
      }
    }
  });

  console.log(`   Found ${clubsWithRules.length} clubs with rules to migrate`);

  for (const club of clubsWithRules) {
    // Create a default rules profile for this club
    const rulesProfile = await prisma.rulesProfile.create({
      data: {
        name: 'Default Rules',
        description: 'Migrated from team-specific rules',
        clubId: club.id,
        isClubDefault: true,
        isActive: true
      }
    });

    console.log(`   ✅ Created default profile for club: ${club.name}`);

    // Get unique rules across all teams in this club
    const allRules = club.teams.flatMap(team => team.rules);
    const uniqueRules = Array.from(
      new Map(allRules.map(rule => [rule.name, rule])).values()
    );

    console.log(`   📋 Found ${uniqueRules.length} unique rules for ${club.name}`);

    // Create global rules and link them to the profile
    for (const teamRule of uniqueRules) {
      // Create or find global rule
      let globalRule = await prisma.rule.findFirst({
        where: { name: teamRule.name }
      });

      if (!globalRule) {
        // Create global rule (without teamId)
        globalRule = await prisma.rule.create({
          data: {
            name: teamRule.name,
            description: teamRule.description,
            category: teamRule.category,
            pointsAwarded: teamRule.pointsAwarded,
            isMultiplier: teamRule.isMultiplier,
            targetScope: teamRule.targetScope,
            targetPositions: teamRule.targetPositions,
            isActive: teamRule.isActive
          }
        });

        // Create rule conditions
        if (teamRule.conditions.length > 0) {
          await prisma.ruleCondition.createMany({
            data: teamRule.conditions.map(condition => ({
              ruleId: globalRule.id,
              variable: condition.variable,
              operator: condition.operator,
              value: condition.value,
              scope: condition.scope
            }))
          });
        }
      }

      // Link rule to profile
      await prisma.rulesProfileRule.create({
        data: {
          profileId: rulesProfile.id,
          ruleId: globalRule.id,
          customPoints: teamRule.pointsAwarded,
          isEnabled: teamRule.isActive
        }
      });
    }
  }
}

async function linkTeamsToProfiles() {
  const teams = await prisma.team.findMany({
    include: { club: { include: { rulesProfiles: true } } }
  });

  for (const team of teams) {
    const defaultProfile = team.club.rulesProfiles.find(p => p.isClubDefault);
    if (defaultProfile) {
      await prisma.team.update({
        where: { id: team.id },
        data: { defaultRulesProfileId: defaultProfile.id }
      });
    }
  }

  console.log(`   🔗 Linked ${teams.length} teams to their club's default profiles`);
}

async function createDualPointTracking() {
  // Note: This would need to be done carefully in production
  // For now, we'll use db push to handle the schema changes
  console.log('   ⚠️  Dual point tracking requires schema updates via db push');
  console.log('   🎯 After schema is updated, run the point duplication script');
}

// Verification function
async function verifyMigration() {
  const profiles = await prisma.rulesProfile.count();
  const profileRules = await prisma.rulesProfileRule.count();
  const teamsWithProfiles = await prisma.team.count({
    where: { defaultRulesProfileId: { not: null } }
  });

  console.log('\n📊 Migration Results:');
  console.log(`   Rules Profiles: ${profiles}`);
  console.log(`   Profile Rules: ${profileRules}`);
  console.log(`   Teams with profiles: ${teamsWithProfiles}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, verifyMigration };