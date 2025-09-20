/**
 * Data Conflict Checker
 *
 * Checks for potential conflicts before applying the RulesProfile migration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for data conflicts...');

  try {
    // Check 1: Rule names (now global)
    console.log('\n📋 Checking rule names...');
    const rules = await prisma.rule.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    const ruleNames = {};
    const duplicateNames = [];

    for (const rule of rules) {
      if (ruleNames[rule.name]) {
        if (!duplicateNames.includes(rule.name)) {
          duplicateNames.push(rule.name);
        }
      } else {
        ruleNames[rule.name] = [];
      }
      ruleNames[rule.name].push(rule);
    }

    if (duplicateNames.length > 0) {
      console.log(`   ⚠️  Found ${duplicateNames.length} duplicate rule names:`);
      for (const name of duplicateNames) {
        console.log(`      "${name}" - used by ${ruleNames[name].length} teams`);
      }
    } else {
      console.log('   ✅ No duplicate rule names found');
    }

    // Check 2: Player game rule points structure
    console.log('\n🎯 Checking player game rule points...');
    const playerGameRulePoints = await prisma.playerGameRulePoints.findMany({
      select: { playerId: true, gameId: true, ruleId: true },
      take: 5 // Sample first 5
    });

    console.log(`   📊 Found ${playerGameRulePoints.length} existing player game rule point records`);

    // Check 3: Teams and clubs structure
    console.log('\n🏒 Checking teams and clubs...');
    const teams = await prisma.team.findMany({
      include: {
        club: { select: { id: true, name: true } }
      }
    });

    let totalTeamRules = 0;
    const clubStats = {};

    for (const team of teams) {
      if (!clubStats[team.club.id]) {
        clubStats[team.club.id] = {
          name: team.club.name,
          teamCount: 0
        };
      }

      clubStats[team.club.id].teamCount++;
    }

    console.log(`   🏆 Found ${teams.length} teams across ${Object.keys(clubStats).length} clubs`);

    for (const [clubId, stats] of Object.entries(clubStats)) {
      console.log(`      ${stats.name}: ${stats.teamCount} teams`);
    }

    // Check 4: Suggest migration approach
    console.log('\n💡 Migration Recommendations:');

    if (duplicateNames.length > 0) {
      console.log('   🔧 Need to resolve duplicate rule names before migration');
      console.log('   📝 Suggestion: Rename rules to include team/club prefix');
    }

    console.log(`   🔄 Will create ${Object.keys(clubStats).length} club default profiles`);
    console.log(`   🎯 Global rules system already in place`);

    console.log('\n✅ Data conflict check completed');

  } catch (error) {
    console.error('❌ Error checking data conflicts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}