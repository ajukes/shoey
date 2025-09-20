const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCustomVariables() {
  console.log('🔍 Checking existing custom variables...');

  try {
    const variables = await prisma.customVariable.findMany();
    console.log(`Found ${variables.length} custom variables:`);

    if (variables.length > 0) {
      variables.forEach(variable => {
        console.log(`- ${variable.key} (${variable.label}) - Team: ${variable.teamId}`);
      });

      // Check for duplicate keys
      const keyCount = {};
      variables.forEach(variable => {
        keyCount[variable.key] = (keyCount[variable.key] || 0) + 1;
      });

      const duplicates = Object.entries(keyCount).filter(([key, count]) => count > 1);

      if (duplicates.length > 0) {
        console.log('\n⚠️  Found duplicate keys:');
        duplicates.forEach(([key, count]) => {
          console.log(`- "${key}" appears ${count} times`);
        });

        console.log('\n🧹 Cleaning up duplicates...');
        for (const [key] of duplicates) {
          const duplicateVars = await prisma.customVariable.findMany({
            where: { key },
            orderBy: { createdAt: 'asc' }
          });

          // Keep the first one, delete the rest
          const toDelete = duplicateVars.slice(1);
          for (const varToDelete of toDelete) {
            console.log(`  Deleting duplicate: ${varToDelete.key} (ID: ${varToDelete.id})`);
            await prisma.customVariable.delete({
              where: { id: varToDelete.id }
            });
          }
        }
        console.log('✅ Duplicates cleaned up');
      } else {
        console.log('✅ No duplicate keys found');
      }
    } else {
      console.log('✅ No custom variables found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomVariables();