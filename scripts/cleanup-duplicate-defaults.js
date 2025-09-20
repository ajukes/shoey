const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateDefaults() {
  console.log('🧹 Cleaning up duplicate default profiles...');

  // Find Brighton & Hove Hockey Club
  const club = await prisma.club.findFirst({
    where: { name: 'Brighton & Hove Hockey Club' }
  });

  if (!club) {
    console.log('❌ Club not found');
    return;
  }

  // Find all default profiles for this club
  const defaultProfiles = await prisma.rulesProfile.findMany({
    where: {
      clubId: club.id,
      isClubDefault: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${defaultProfiles.length} default profiles`);

  if (defaultProfiles.length > 1) {
    // Keep the first one (oldest) and remove the rest
    const toKeep = defaultProfiles[0];
    const toDelete = defaultProfiles.slice(1);

    console.log(`Keeping profile: ${toKeep.name} (${toKeep.id})`);

    for (const profile of toDelete) {
      console.log(`Deleting duplicate: ${profile.name} (${profile.id})`);

      // Check if any teams are using this profile
      const teamsUsingProfile = await prisma.team.findMany({
        where: { defaultRulesProfileId: profile.id }
      });

      if (teamsUsingProfile.length > 0) {
        console.log(`  Updating ${teamsUsingProfile.length} teams to use the kept profile...`);
        await prisma.team.updateMany({
          where: { defaultRulesProfileId: profile.id },
          data: { defaultRulesProfileId: toKeep.id }
        });
      }

      // Delete the duplicate profile
      await prisma.rulesProfile.delete({
        where: { id: profile.id }
      });
    }

    console.log('✅ Cleanup completed!');
  } else {
    console.log('✅ No duplicates found');
  }
}

cleanupDuplicateDefaults()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });