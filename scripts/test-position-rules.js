const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPositionRules() {
  console.log('🧪 Testing position-based rules...');

  try {
    // Create test rules for different positions scoring goals
    const defenderGoalRule = await prisma.rule.create({
      data: {
        name: 'Defender Goal Bonus',
        description: 'Extra points for defenders who score goals',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: 5,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
        conditions: {
          create: [
            {
              variable: 'position',
              operator: 'EQUAL',
              value: 2, // DEFENDER = 2
              scope: 'PLAYER'
            },
            {
              variable: 'goalsScored',
              operator: 'GREATER_THAN',
              value: 0,
              scope: 'PLAYER'
            }
          ]
        }
      },
      include: {
        conditions: true
      }
    });

    const strikerGoalRule = await prisma.rule.create({
      data: {
        name: 'Striker Goal Standard',
        description: 'Standard points for strikers who score goals',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: 3,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
        conditions: {
          create: [
            {
              variable: 'position',
              operator: 'EQUAL',
              value: 4, // FORWARD = 4
              scope: 'PLAYER'
            },
            {
              variable: 'goalsScored',
              operator: 'GREATER_THAN',
              value: 0,
              scope: 'PLAYER'
            }
          ]
        }
      },
      include: {
        conditions: true
      }
    });

    const midfielderGoalRule = await prisma.rule.create({
      data: {
        name: 'Midfielder Goal Bonus',
        description: 'Bonus points for midfielders who score goals',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: 4,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
        conditions: {
          create: [
            {
              variable: 'position',
              operator: 'EQUAL',
              value: 3, // MIDFIELDER = 3
              scope: 'PLAYER'
            },
            {
              variable: 'goalsScored',
              operator: 'GREATER_THAN',
              value: 0,
              scope: 'PLAYER'
            }
          ]
        }
      },
      include: {
        conditions: true
      }
    });

    console.log('✅ Position-based rules created successfully:');
    console.log(`   Defender Goal Bonus: +${defenderGoalRule.pointsAwarded} points`);
    console.log(`   Midfielder Goal Bonus: +${midfielderGoalRule.pointsAwarded} points`);
    console.log(`   Striker Goal Standard: +${strikerGoalRule.pointsAwarded} points`);

    console.log('\n📋 Rule conditions:');
    console.log(`   Defender rule conditions: ${defenderGoalRule.conditions.length}`);
    defenderGoalRule.conditions.forEach(condition => {
      console.log(`      ${condition.variable} ${condition.operator} ${condition.value}`);
    });

    // Clean up - delete the test rules
    await prisma.rule.delete({ where: { id: defenderGoalRule.id } });
    await prisma.rule.delete({ where: { id: strikerGoalRule.id } });
    await prisma.rule.delete({ where: { id: midfielderGoalRule.id } });

    console.log('\n🧹 Test rules cleaned up');
    console.log('✅ Position-based rules test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPositionRules();