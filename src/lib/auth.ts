import { getServerSession } from 'next-auth';
import { useSession as useNextAuthSession } from 'next-auth/react';
import { NextRequest } from 'next/server';
import { PrismaClient, PlayerRole } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { Session } from 'next-auth';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface AuthenticatedUser {
  id: string;
  email: string;
  player?: {
    id: string;
    fullName: string;
    role: PlayerRole;
    clubId: string;
    teamId?: string;
    club: {
      id: string;
      name: string;
    };
    team?: {
      id: string;
      name: string;
    };
  };
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      return null;
    }

    // Since we're using database sessions and already fetching player data in the session callback,
    // we can directly use the session data if it's available
    if (session.user.player) {
      return {
        id: session.user.id,
        email: session.user.email,
        player: session.user.player,
      };
    }

    // Fallback: fetch player data if not in session
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: {
        club: true,
        team: true,
      },
    });

    return {
      id: session.user.id,
      email: session.user.email,
      player: player ? {
        id: player.id,
        fullName: player.fullName,
        role: player.role,
        clubId: player.clubId,
        teamId: player.teamId || undefined,
        club: player.club,
        team: player.team,
      } : undefined,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

export function hasRole(user: AuthenticatedUser | null, roles: PlayerRole[]): boolean {
  if (!user?.player) return false;
  return roles.includes(user.player.role);
}

export function isAdmin(user: AuthenticatedUser | null): boolean {
  return hasRole(user, [PlayerRole.ADMIN]);
}

export function canManageClub(user: AuthenticatedUser | null): boolean {
  return hasRole(user, [PlayerRole.ADMIN, PlayerRole.MANAGER]);
}

export function canManageTeam(user: AuthenticatedUser | null): boolean {
  return hasRole(user, [PlayerRole.ADMIN, PlayerRole.MANAGER, PlayerRole.CAPTAIN]);
}

export function canCreateGames(user: AuthenticatedUser | null): boolean {
  return hasRole(user, [PlayerRole.ADMIN, PlayerRole.MANAGER, PlayerRole.CAPTAIN]);
}

export function canViewClubData(user: AuthenticatedUser | null): boolean {
  return hasRole(user, [PlayerRole.ADMIN, PlayerRole.MANAGER, PlayerRole.CAPTAIN, PlayerRole.PLAYER]);
}

export interface DataScope {
  clubId?: string;
  teamId?: string;
  isAdmin: boolean;
}

export function getUserScope(user: AuthenticatedUser | null): DataScope {
  if (!user?.player) {
    return { isAdmin: false };
  }

  const isAdminUser = isAdmin(user);

  return {
    clubId: isAdminUser ? undefined : user.player.clubId,
    teamId: isAdminUser ? undefined : user.player.teamId,
    isAdmin: isAdminUser,
  };
}

// Client-side session hook
export function useSession() {
  const { data: session, status } = useNextAuthSession();

  return {
    session,
    status,
    user: session?.user,
    player: session?.user?.player,
    isAuthenticated: !!session?.user,
    isPlayer: !!session?.user?.player,
    role: session?.user?.player?.role,
    clubId: session?.user?.player?.clubId,
    teamId: session?.user?.player?.teamId,
    loading: status === 'loading',
  };
}

// Enhanced role-based permission functions
export function canAdministrateTeam(user: AuthenticatedUser | null, teamId?: string): boolean {
  if (!user?.player) return false;

  const { role, teamId: userTeamId } = user.player;

  // ADMIN can administrate any team
  if (role === 'ADMIN') return true;

  // MANAGER can administrate any team in their club
  if (role === 'MANAGER') return true; // Club filtering will be done at API level

  // CAPTAIN can only administrate their preferred team
  if (role === 'CAPTAIN') {
    return userTeamId === teamId;
  }

  return false;
}

export function canAdministrateClub(user: AuthenticatedUser | null, clubId?: string): boolean {
  if (!user?.player) return false;

  const { role, clubId: userClubId } = user.player;

  // ADMIN can administrate any club
  if (role === 'ADMIN') return true;

  // MANAGER can administrate their own club
  if (role === 'MANAGER') {
    return userClubId === clubId;
  }

  return false;
}

export function getGameFilters(user: AuthenticatedUser | null) {
  if (!user?.player) {
    return { canView: false };
  }

  const { role, clubId, teamId } = user.player;

  switch (role) {
    case 'ADMIN':
      return {
        canView: true,
        viewAll: true,
        administerAll: true,
      };

    case 'MANAGER':
      return {
        canView: true,
        viewAll: false,
        administerAll: false,
        clubId,
        canAdministerClub: true,
      };

    case 'CAPTAIN':
      return {
        canView: true,
        viewAll: false,
        administerAll: false,
        clubId,
        canAdministerTeam: teamId,
      };

    case 'PLAYER':
      return {
        canView: true,
        viewAll: false,
        administerAll: false,
        clubId,
        canAdminister: false,
      };

    default:
      return { canView: false };
  }
}

export type GameFilters = ReturnType<typeof getGameFilters>;

// Session-based permission helpers (for use with client-side session)
export function hasRoleSession(session: Session | null, roles: PlayerRole[]): boolean {
  if (!session?.user?.player) return false;
  return roles.includes(session.user.player.role);
}

export function isAdminSession(session: Session | null): boolean {
  return hasRoleSession(session, ['ADMIN']);
}

export function isManagerSession(session: Session | null): boolean {
  return hasRoleSession(session, ['MANAGER', 'ADMIN']);
}

export function isCaptainSession(session: Session | null): boolean {
  return hasRoleSession(session, ['CAPTAIN', 'MANAGER', 'ADMIN']);
}

export function canAdministrateGamesSession(session: Session | null): boolean {
  return hasRoleSession(session, ['CAPTAIN', 'MANAGER', 'ADMIN']);
}