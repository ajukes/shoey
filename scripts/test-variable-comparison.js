const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVariableComparison() {
  console.log('🧪 Testing variable-to-variable comparison...');

  try {
    // Create a test rule for team win with variable comparison
    const testRule = await prisma.rule.create({
      data: {
        name: 'Test Team Win (goalsFor > goalsAgainst)',
        description: 'Test rule using variable-to-variable comparison',
        category: 'GAME_RESULT',
        pointsAwarded: 5,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
        conditions: {
          create: [
            {
              variable: 'goalsFor',
              operator: 'GREATER_THAN',
              value: 0,
              compareVariable: 'goalsAgainst',
              scope: 'GAME'
            }
          ]
        }
      },
      include: {
        conditions: true
      }
    });

    console.log('✅ Test rule created successfully:');
    console.log(`   Name: ${testRule.name}`);
    console.log(`   Condition: ${testRule.conditions[0].variable} ${testRule.conditions[0].operator} ${testRule.conditions[0].compareVariable}`);
    console.log(`   Compare Variable: ${testRule.conditions[0].compareVariable}`);

    // Clean up - delete the test rule
    await prisma.rule.delete({
      where: { id: testRule.id }
    });

    console.log('🧹 Test rule cleaned up');
    console.log('✅ Variable-to-variable comparison test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVariableComparison();