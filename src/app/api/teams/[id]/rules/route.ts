import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user || !user.player) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Get team with its rules profile
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: true,
        defaultRulesProfile: {
          include: {
            rules: {
              where: { isEnabled: true },
              include: {
                rule: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check permissions - user must be able to view this team
    const { role, clubId } = user.player;
    if (role !== 'ADMIN' && team.clubId !== clubId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    let effectiveRules: any[] = [];

    console.log('Team data:', {
      teamId: team.id,
      teamName: team.name,
      clubId: team.clubId,
      hasDefaultProfile: !!team.defaultRulesProfile,
      defaultProfileId: team.defaultRulesProfileId
    });

    if (team.defaultRulesProfile) {
      // Team has a specific rules profile - use those rules with custom points if set
      effectiveRules = team.defaultRulesProfile.rules.map(profileRule => ({
        id: profileRule.rule.id,
        name: profileRule.rule.name,
        description: profileRule.rule.description,
        pointsAwarded: profileRule.customPoints ?? profileRule.rule.pointsAwarded,
        category: profileRule.rule.category,
        targetScope: profileRule.rule.targetScope,
        conditions: profileRule.rule.conditions || [],
        isCustomPoints: profileRule.customPoints !== null
      }));
    } else {
      // No team-specific profile - get club's default rules profile
      const clubDefaultProfile = await prisma.rulesProfile.findFirst({
        where: {
          clubId: team.clubId,
          isClubDefault: true,
          isActive: true
        },
        include: {
          rules: {
            where: { isEnabled: true },
            include: {
              rule: true
            }
          }
        }
      });

      console.log('Club default profile search:', {
        clubId: team.clubId,
        foundProfile: !!clubDefaultProfile,
        profileId: clubDefaultProfile?.id,
        rulesCount: clubDefaultProfile?.rules?.length || 0
      });

      if (clubDefaultProfile) {
        effectiveRules = clubDefaultProfile.rules.map(profileRule => ({
          id: profileRule.rule.id,
          name: profileRule.rule.name,
          description: profileRule.rule.description,
          pointsAwarded: profileRule.customPoints ?? profileRule.rule.pointsAwarded,
          category: profileRule.rule.category,
          targetScope: profileRule.rule.targetScope,
          conditions: profileRule.rule.conditions || [],
          isCustomPoints: profileRule.customPoints !== null
        }));
      } else {
        // No club default profile - get all global rules
        const globalRules = await prisma.rule.findMany({
          include: {
            conditions: true
          }
        });

        console.log('Global rules fallback:', {
          globalRulesCount: globalRules.length,
          globalRuleNames: globalRules.map(r => r.name)
        });

        effectiveRules = globalRules.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          pointsAwarded: rule.pointsAwarded,
          category: rule.category,
          targetScope: rule.targetScope,
          conditions: rule.conditions || [],
          isCustomPoints: false
        }));
      }
    }

    // Sort rules by category and name for consistent ordering
    effectiveRules.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    console.log('Final effective rules:', {
      count: effectiveRules.length,
      ruleNames: effectiveRules.map(r => r.name)
    });

    return NextResponse.json(effectiveRules);
  } catch (error) {
    console.error('Error fetching team rules:', error);
    return NextResponse.json({ error: 'Failed to fetch team rules' }, { status: 500 });
  }
}