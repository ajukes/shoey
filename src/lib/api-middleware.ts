import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticatedUser, getUserScope } from './auth';
import { PlayerRole } from '@prisma/client';

export interface APIContext {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  scope: {
    clubId?: string;
    teamId?: string;
    isAdmin: boolean;
  };
}

export async function withAuth(
  handler: (request: NextRequest, context: APIContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeContext?: any) => {
    try {
      const user = await getAuthenticatedUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (!user.player) {
        return NextResponse.json(
          { error: 'Player profile required. Please contact an administrator.' },
          { status: 403 }
        );
      }

      const scope = getUserScope(user);

      const context: APIContext = {
        user,
        isAuthenticated: true,
        scope,
      };

      return await handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export async function withRoles(
  roles: PlayerRole[],
  handler: (request: NextRequest, context: APIContext) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, context: APIContext) => {
    if (!context.user?.player || !roles.includes(context.user.player.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, context);
  });
}

export function buildGameFilters(context: APIContext, params?: {
  teamId?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const { user, scope } = context;

  if (!user?.player) {
    throw new Error('User not authenticated');
  }

  const baseFilters: any = {};

  // Apply date filters if provided
  if (params?.from || params?.to) {
    baseFilters.dateTime = {};
    if (params.from) baseFilters.dateTime.gte = new Date(params.from);
    if (params.to) baseFilters.dateTime.lte = new Date(params.to);
  }

  // Apply status filter if provided
  if (params?.status) {
    baseFilters.status = params.status;
  }

  // Apply team filter if provided (for specific team viewing)
  if (params?.teamId) {
    baseFilters.teamId = params.teamId;
  }

  // Apply role-based filtering
  const { role, clubId, teamId } = user.player;

  switch (role) {
    case 'ADMIN':
      // ADMIN can see all games
      return baseFilters;

    case 'MANAGER':
      // MANAGER can see all games for teams in their club
      return {
        ...baseFilters,
        team: {
          clubId: clubId,
        },
      };

    case 'CAPTAIN':
      // CAPTAIN can see all games for teams in their club
      return {
        ...baseFilters,
        team: {
          clubId: clubId,
        },
      };

    case 'PLAYER':
      // PLAYER can see all games for teams in their club
      return {
        ...baseFilters,
        team: {
          clubId: clubId,
        },
      };

    default:
      throw new Error('Invalid user role');
  }
}

export function canAdministerGame(context: APIContext, game: { teamId: string }) {
  const { user } = context;

  if (!user?.player) return false;

  const { role, clubId, teamId } = user.player;

  switch (role) {
    case 'ADMIN':
      return true;

    case 'MANAGER':
      // Need to check if the game's team belongs to manager's club
      // This will need to be verified at the database level
      return true; // Will be filtered by club at query level

    case 'CAPTAIN':
      // CAPTAIN can only administer games for their preferred team
      return teamId === game.teamId;

    default:
      return false;
  }
}

export function buildTeamFilters(context: APIContext) {
  const { user } = context;

  if (!user?.player) {
    throw new Error('User not authenticated');
  }

  const { role, clubId } = user.player;

  switch (role) {
    case 'ADMIN':
      // ADMIN can see all teams
      return {};

    case 'MANAGER':
    case 'CAPTAIN':
    case 'PLAYER':
      // All other roles can only see teams in their club
      return {
        clubId: clubId,
      };

    default:
      throw new Error('Invalid user role');
  }
}

export function buildLeagueFilters(context: APIContext) {
  const { user } = context;

  if (!user?.player) {
    throw new Error('User not authenticated');
  }

  const { role, clubId } = user.player;

  switch (role) {
    case 'ADMIN':
      // ADMIN can see all leagues
      return {};

    case 'MANAGER':
    case 'CAPTAIN':
    case 'PLAYER':
      // Other roles can see leagues that their club's teams participate in
      return {
        teamLeagues: {
          some: {
            team: {
              clubId: clubId,
            },
          },
        },
      };

    default:
      throw new Error('Invalid user role');
  }
}