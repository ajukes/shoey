import { PrismaClient, PositionCategory, PlayerRole, GameStatus, KitType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // Create playing positions
  const positions = await Promise.all([
    // Hockey positions
    prisma.playingPosition.upsert({
      where: { name: 'Goalkeeper' },
      update: {},
      create: {
        name: 'Goalkeeper',
        category: PositionCategory.GOALKEEPER,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Left Back' },
      update: {},
      create: {
        name: 'Left Back',
        category: PositionCategory.DEFENDER,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Right Back' },
      update: {},
      create: {
        name: 'Right Back',
        category: PositionCategory.DEFENDER,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Centre Back' },
      update: {},
      create: {
        name: 'Centre Back',
        category: PositionCategory.DEFENDER,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Left Mid' },
      update: {},
      create: {
        name: 'Left Mid',
        category: PositionCategory.MIDFIELDER,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Right Mid' },
      update: {},
      create: {
        name: 'Right Mid',
        category: PositionCategory.MIDFIELDER,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Centre Mid' },
      update: {},
      create: {
        name: 'Centre Mid',
        category: PositionCategory.MIDFIELDER,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Left Wing' },
      update: {},
      create: {
        name: 'Left Wing',
        category: PositionCategory.FORWARD,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Right Wing' },
      update: {},
      create: {
        name: 'Right Wing',
        category: PositionCategory.FORWARD,
      },
    }),
    prisma.playingPosition.upsert({
      where: { name: 'Centre Forward' },
      update: {},
      create: {
        name: 'Centre Forward',
        category: PositionCategory.FORWARD,
      },
    }),
  ]);

  console.log('✅ Created playing positions');

  // Create global rules first (before season/league/teams)
  const rules = await Promise.all([
    prisma.rule.upsert({
      where: { name: 'Goal Scored' },
      update: {},
      create: {
        name: 'Goal Scored',
        description: 'Points awarded for scoring a goal',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: 3,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
      },
    }),
    prisma.rule.upsert({
      where: { name: 'Assist' },
      update: {},
      create: {
        name: 'Assist',
        description: 'Points awarded for assisting a goal',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: 2,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
      },
    }),
    prisma.rule.upsert({
      where: { name: 'Clean Sheet' },
      update: {},
      create: {
        name: 'Clean Sheet',
        description: 'Points for goalkeeper when team concedes no goals',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: 4,
        isMultiplier: false,
        targetScope: 'BY_POSITION',
        targetPositions: ['GOALKEEPER'],
        isActive: true,
      },
    }),
    prisma.rule.upsert({
      where: { name: 'Yellow Card' },
      update: {},
      create: {
        name: 'Yellow Card',
        description: 'Penalty points for receiving a yellow card',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: -1,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
      },
    }),
    prisma.rule.upsert({
      where: { name: 'Red Card' },
      update: {},
      create: {
        name: 'Red Card',
        description: 'Penalty points for receiving a red card',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: -3,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
      },
    }),
    prisma.rule.upsert({
      where: { name: 'Man of the Match' },
      update: {},
      create: {
        name: 'Man of the Match',
        description: 'Bonus points for being awarded man of the match',
        category: 'MANUAL',
        pointsAwarded: 5,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
      },
    }),
    prisma.rule.upsert({
      where: { name: 'Team Win Bonus' },
      update: {},
      create: {
        name: 'Team Win Bonus',
        description: 'Bonus points awarded to all players when team wins',
        category: 'GAME_RESULT',
        pointsAwarded: 2,
        isMultiplier: false,
        targetScope: 'ALL_PLAYERS',
        targetPositions: [],
        isActive: true,
      },
    }),
    prisma.rule.upsert({
      where: { name: 'Save Made' },
      update: {},
      create: {
        name: 'Save Made',
        description: 'Points for goalkeeper saves (per 3 saves)',
        category: 'PLAYER_PERFORMANCE',
        pointsAwarded: 1,
        isMultiplier: false,
        targetScope: 'BY_POSITION',
        targetPositions: ['GOALKEEPER'],
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created global rules');

  // Create season first
  const season = await prisma.season.upsert({
    where: { year: '2025/26' },
    update: {
      name: '2025/26 Hockey Season',
      sport: 'Hockey',
    },
    create: {
      name: '2025/26 Hockey Season',
      year: '2025/26',
      sport: 'Hockey',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-05-31'),
    },
  });

  console.log('✅ Created season');

  // Create league
  const league = await prisma.league.create({
    data: {
      name: 'South East Mens Division 2 Martlets',
      seasonId: season.id,
      sport: 'Hockey',
      location: 'South East England',
    },
  });

  console.log('✅ Created league');

  // Create club
  let club = await prisma.club.findFirst({
    where: { name: 'Brighton & Hove Hockey Club' },
  });

  if (!club) {
    club = await prisma.club.create({
      data: {
        name: 'Brighton & Hove Hockey Club',
      },
    });
  }

  console.log('✅ Created club');

  // Create or find default rules profile for the club
  let clubDefaultProfile = await prisma.rulesProfile.findFirst({
    where: { clubId: club.id, isClubDefault: true }
  });

  if (!clubDefaultProfile) {
    clubDefaultProfile = await prisma.rulesProfile.create({
      data: {
        name: 'Club Standard',
        description: 'Standard club-wide scoring system used for all team comparisons',
        clubId: club.id,
        isClubDefault: true,
        rules: {
          create: [
            { ruleId: rules.find(r => r.name === 'Goal Scored')!.id, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Assist')!.id, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Clean Sheet')!.id, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Yellow Card')!.id, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Red Card')!.id, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Team Win Bonus')!.id, isEnabled: true },
          ]
        }
      }
    });
  }

  // Create or find competitive profile for high-level teams
  let competitiveProfile = await prisma.rulesProfile.findFirst({
    where: { clubId: club.id, name: 'Competitive League' }
  });

  if (!competitiveProfile) {
    competitiveProfile = await prisma.rulesProfile.create({
      data: {
        name: 'Competitive League',
        description: 'Enhanced scoring system with bonuses for competitive leagues',
        clubId: club.id,
        isClubDefault: false,
        rules: {
          create: [
            { ruleId: rules.find(r => r.name === 'Goal Scored')!.id, customPoints: 4, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Assist')!.id, customPoints: 3, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Clean Sheet')!.id, customPoints: 5, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Yellow Card')!.id, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Red Card')!.id, customPoints: -5, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Man of the Match')!.id, customPoints: 8, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Team Win Bonus')!.id, customPoints: 3, isEnabled: true },
            { ruleId: rules.find(r => r.name === 'Save Made')!.id, isEnabled: true },
          ]
        }
      }
    });
  }

  console.log('✅ Created rules profiles');

  // Create teams
  let team6s = await prisma.team.findFirst({
    where: { name: 'BHHC Mens 6s' },
  });

  if (!team6s) {
    team6s = await prisma.team.create({
      data: {
        name: 'BHHC Mens 6s',
        clubId: club.id,
        defaultRulesProfileId: competitiveProfile.id,
      },
    });
  } else {
    // Update existing team with competitive profile
    team6s = await prisma.team.update({
      where: { id: team6s.id },
      data: { defaultRulesProfileId: competitiveProfile.id }
    });
  }

  let team4s = await prisma.team.findFirst({
    where: { name: 'BHHC Mens 4s' },
  });

  if (!team4s) {
    team4s = await prisma.team.create({
      data: {
        name: 'BHHC Mens 4s',
        clubId: club.id,
        defaultRulesProfileId: clubDefaultProfile.id,
      },
    });
  } else {
    // Update existing team with club default profile
    team4s = await prisma.team.update({
      where: { id: team4s.id },
      data: { defaultRulesProfileId: clubDefaultProfile.id }
    });
  }

  console.log('✅ Created teams');

  // Create team-league relationships for both teams
  await prisma.teamLeague.upsert({
    where: {
      teamId_leagueId: {
        teamId: team6s.id,
        leagueId: league.id,
      },
    },
    update: {},
    create: {
      teamId: team6s.id,
      leagueId: league.id,
    },
  });

  await prisma.teamLeague.upsert({
    where: {
      teamId_leagueId: {
        teamId: team4s.id,
        leagueId: league.id,
      },
    },
    update: {},
    create: {
      teamId: team4s.id,
      leagueId: league.id,
    },
  });

  console.log('✅ Created team-league relationships');

  // Create sample users and players
  const users = [
    {
      name: 'Antony Jukes',
      email: 'juk3sie@gmail.com',
      fullName: 'Antony Jukes',
      nickname: 'Antony',
      role: PlayerRole.ADMIN,
      position: positions.find(p => p.name === 'Right Wing')!.id,
      mobileNumber: '+447939345980',
      teamId: team6s.id,
    },
    {
      name: 'Jamie Morris',
      email: 'Jamie.e.l.morris@gmail.com',
      fullName: 'Jamie Morris',
      nickname: 'Jamie',
      role: PlayerRole.CAPTAIN,
      position: positions.find(p => p.name === 'Centre Back')!.id,
      mobileNumber: '+447906521554',
      teamId: team6s.id,
    },
    {
      name: 'Nathan Thorley',
      email: 'Nathan.thorley4@gmail.com',
      fullName: 'Nathan Thorley',
      nickname: 'Nathan',
      role: PlayerRole.MANAGER,
      position: positions.find(p => p.name === 'Centre Mid')!.id,
      mobileNumber: '+447825613574',
      teamId: team4s.id,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        name: userData.name,
        email: userData.email,
      },
    });

    await prisma.player.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        userId: user.id,
        fullName: userData.fullName,
        nickname: userData.nickname,
        email: userData.email,
        mobileNumber: userData.mobileNumber,
        role: userData.role,
        clubId: club.id,
        teamId: userData.teamId,
        playingPositionId: userData.position,
      },
    });
  }

  console.log('✅ Created users and players');

  // Create sample game for September 20th
  const games = [
    {
      dateTime: new Date('2025-09-20T00:00:00Z'),
      gameTime: '10:00',
      meetTime: '09:00',
      venue: 'The Saffrons',
      address: 'Compton Pl Rd, Eastbourne BN21 1EA',
      kit: 'AWAY' as const,
      opponent: 'Eastbourne 3s',
      goalsFor: null,
      goalsAgainst: null,
      status: GameStatus.SCHEDULED,
      teamId: team6s.id,
    },
  ];

  for (const gameData of games) {
    await prisma.game.create({
      data: {
        ...gameData,
      },
    });
  }

  console.log('✅ Created games');

  // Add Jamie to the game squad
  const jamiePlayer = await prisma.player.findUnique({
    where: { email: 'Jamie.e.l.morris@gmail.com' },
  });

  if (jamiePlayer && games.length > 0) {
    const game = await prisma.game.findFirst({
      where: { opponent: 'Eastbourne 3s' },
    });

    if (game) {
      await prisma.gamePlayer.upsert({
        where: {
          gameId_playerId: {
            gameId: game.id,
            playerId: jamiePlayer.id,
          },
        },
        update: {},
        create: {
          gameId: game.id,
          playerId: jamiePlayer.id,
          teamId: team6s.id,
        },
      });
    }
  }

  console.log('✅ Added Jamie to game squad');

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });