const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkHardcodedRules() {
  console.log('🔍 Checking for hardcoded rules...');

  try {
    // List of hardcoded rule names from the seed script
    const hardcodedRuleNames = [
      'Goal Scored',
      'Assist',
      'Clean Sheet',
      'Yellow Card',
      'Red Card',
      'Man of the Match',
      'Team Win Bonus',
      'Save Made'
    ];

    const hardcodedRules = await prisma.rule.findMany({
      where: {
        name: {
          in: hardcodedRuleNames
        }
      },
      include: {
        _count: {
          select: {
            rulesProfileRules: true
          }
        }
      }
    });

    console.log(`Found ${hardcodedRules.length} hardcoded rules:`);
    hardcodedRules.forEach(rule => {
      console.log(`- ${rule.name}: ${rule.pointsAwarded} points, used in ${rule._count.rulesProfileRules} profiles`);
    });

    if (hardcodedRules.length > 0) {
      console.log('\n⚠️  These rules were created by the seed script.');
      console.log('Would you like to remove them? (They should be created through the UI instead)');

      // Check if any are being used in rules profiles
      const rulesInUse = hardcodedRules.filter(rule => rule._count.rulesProfileRules > 0);

      if (rulesInUse.length > 0) {
        console.log('\n🔒 Some rules are currently in use by rules profiles:');
        rulesInUse.forEach(rule => {
          console.log(`   - ${rule.name} (used in ${rule._count.rulesProfileRules} profiles)`);
        });
        console.log('   You may want to recreate these through the UI first before removing them.');
      }

      const unusedRules = hardcodedRules.filter(rule => rule._count.rulesProfileRules === 0);

      if (unusedRules.length > 0) {
        console.log('\n🗑️  Removing unused hardcoded rules...');
        for (const rule of unusedRules) {
          console.log(`   Deleting: ${rule.name}`);
          await prisma.rule.delete({
            where: { id: rule.id }
          });
        }
        console.log('✅ Unused hardcoded rules removed.');
      }
    } else {
      console.log('✅ No hardcoded rules found.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHardcodedRules();