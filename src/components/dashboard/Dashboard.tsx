'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Trophy, Users, Calendar, Target, TrendingUp,
  Clock, MapPin, Medal, Award, Star,
  BarChart3, Activity, Flame, ChevronRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import Link from 'next/link';

interface DashboardStats {
  totalPlayers: number;
  gamesPlayed: number;
  completedGames: number;
  totalPoints: number;
  avgPointsPerGame: number;
  clubRank: number;
  teamRank: number;
}

interface RecentGame {
  id: string;
  dateTime: string;
  gameTime: string;
  venue: string;
  opponent?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  status: string;
  team: {
    name: string;
  };
  playerStats: {
    player: {
      fullName: string;
      nickname?: string;
    };
    goalsScored: number;
    goalAssists: number;
  }[];
}

interface TopPerformer {
  playerId: string;
  fullName: string;
  nickname?: string;
  teamName: string;
  totalPoints: number;
  gamesPlayed: number;
  pointsPerGame: number;
  rank: number;
  position?: {
    name: string;
    category: string;
  };
}

interface UpcomingGame {
  id: string;
  dateTime: string;
  gameTime: string;
  venue: string;
  opponent?: string;
  team: {
    name: string;
  };
  status: string;
}

export function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all dashboard data in parallel
      const [statsRes, gamesRes, leaderboardRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/games?limit=5'),
        fetch('/api/leaderboard?pointType=TEAM&limit=5')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        const completed = gamesData.filter((g: any) => g.status === 'COMPLETED').slice(0, 3);
        const upcoming = gamesData
          .filter((g: any) => ['SCHEDULED', 'IN_PROGRESS'].includes(g.status))
          .slice(0, 3);

        setRecentGames(completed);
        setUpcomingGames(upcoming);
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setTopPerformers(leaderboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatGameDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGameResult = (game: RecentGame) => {
    if (game.status === 'COMPLETED' && game.goalsFor !== null && game.goalsAgainst !== null) {
      if (game.goalsFor > game.goalsAgainst) {
        return { result: `W ${game.goalsFor}-${game.goalsAgainst}`, status: 'win' as const };
      } else if (game.goalsFor < game.goalsAgainst) {
        return { result: `L ${game.goalsFor}-${game.goalsAgainst}`, status: 'loss' as const };
      } else {
        return { result: `D ${game.goalsFor}-${game.goalsAgainst}`, status: 'draw' as const };
      }
    }
    return { result: game.gameTime, status: 'scheduled' as const };
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="text-yellow-400" size={16} />;
      case 2: return <Medal className="text-gray-300" size={16} />;
      case 3: return <Award className="text-amber-600" size={16} />;
      default: return <span className="text-white/60 font-bold text-xs">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-white/60 mb-2">Loading dashboard...</div>
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const userRole = session?.user?.player?.role;
  const userClub = session?.user?.player?.club?.name;
  const userTeam = session?.user?.player?.team?.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Player'}
        </h1>
        <p className="text-white/60">
          {userTeam} • {userClub} • {userRole}
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <GlassCard padding="sm" className="text-center">
          <div className="inline-flex p-2 rounded-lg bg-blue-500/20 text-blue-400 mb-3">
            <Users size={20} />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white mb-1">
            {stats?.totalPlayers || 0}
          </div>
          <div className="text-xs md:text-sm text-white/60">
            Active Players
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="text-center">
          <div className="inline-flex p-2 rounded-lg bg-green-500/20 text-green-400 mb-3">
            <Calendar size={20} />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white mb-1">
            {stats?.completedGames || 0}
          </div>
          <div className="text-xs md:text-sm text-white/60">
            Games Completed
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="text-center">
          <div className="inline-flex p-2 rounded-lg bg-purple-500/20 text-purple-400 mb-3">
            <Target size={20} />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white mb-1">
            {stats?.totalPoints?.toLocaleString() || 0}
          </div>
          <div className="text-xs md:text-sm text-white/60">
            Total Points
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="text-center">
          <div className="inline-flex p-2 rounded-lg bg-yellow-500/20 text-yellow-400 mb-3">
            <TrendingUp size={20} />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white mb-1">
            {stats?.avgPointsPerGame?.toFixed(1) || '0.0'}
          </div>
          <div className="text-xs md:text-sm text-white/60">
            Avg Points/Game
          </div>
        </GlassCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Games */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={20} />
              Recent Games
            </h2>
            <Link href="/games">
              <GlassButton variant="glass" size="sm" icon={ChevronRight}>
                View All
              </GlassButton>
            </Link>
          </div>

          <div className="space-y-3">
            {recentGames.length > 0 ? (
              recentGames.map((game) => {
                const gameResult = getGameResult(game);
                const goalScorers = game.playerStats?.filter(p => p.goalsScored > 0)
                  .sort((a, b) => b.goalsScored - a.goalsScored) || [];
                const topScorer = goalScorers[0];

                return (
                  <div key={game.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`font-bold text-sm px-3 py-1 rounded ${
                          gameResult.status === 'win'
                            ? 'text-green-400 bg-green-400/20'
                            : gameResult.status === 'draw'
                            ? 'text-yellow-400 bg-yellow-400/20'
                            : gameResult.status === 'loss'
                            ? 'text-red-400 bg-red-400/20'
                            : 'text-blue-400 bg-blue-400/20'
                        }`}>
                          {gameResult.result}
                        </div>

                        <div>
                          <div className="font-medium text-white">
                            {game.team.name} vs {game.opponent || 'TBD'}
                          </div>
                          <div className="text-xs text-white/60 flex items-center gap-2">
                            <Clock size={12} />
                            {formatGameDate(game.dateTime)}
                            <MapPin size={12} />
                            {game.venue}
                          </div>
                        </div>
                      </div>
                    </div>

                    {goalScorers.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Star size={12} className="text-yellow-400" />
                          Goal scorers:
                        </div>
                        <div className="text-xs text-white/80 ml-5">
                          {goalScorers.map((scorer, index) => (
                            <span key={scorer.player.id}>
                              {scorer.player.nickname || scorer.player.fullName} ({scorer.goalsScored})
                              {index < goalScorers.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-white/60 py-8">
                No completed games yet
              </div>
            )}
          </div>
        </GlassCard>

        {/* Top Performers */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Flame size={20} />
              Top Performers
            </h2>
            <Link href="/leaderboard">
              <GlassButton variant="glass" size="sm" icon={ChevronRight}>
                Leaderboard
              </GlassButton>
            </Link>
          </div>

          <div className="space-y-3">
            {topPerformers.length > 0 ? (
              topPerformers.map((player, index) => (
                <div key={player.playerId} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {getRankIcon(player.rank)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">
                      {player.nickname || player.fullName}
                    </div>
                    <div className="text-xs text-white/60 truncate">
                      {player.teamName} • {player.position?.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-white text-sm">{player.totalPoints}</div>
                    <div className="text-xs text-white/60">{player.pointsPerGame.toFixed(1)} avg</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-white/60 py-8">
                No player data yet
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar size={20} />
              Upcoming Games
            </h2>
            <Link href="/games">
              <GlassButton variant="glass" size="sm" icon={ChevronRight}>
                Manage Games
              </GlassButton>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {upcomingGames.map((game) => (
              <div key={game.id} className="p-4 rounded-lg bg-white/5 border border-blue-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-1 rounded bg-blue-400/20 text-blue-400">
                    {game.status}
                  </span>
                  <span className="text-xs text-white/60">{game.team.name}</span>
                </div>

                <div className="font-medium text-white mb-1">
                  vs {game.opponent || 'TBD'}
                </div>

                <div className="text-xs text-white/60 space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatGameDate(game.dateTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {game.venue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Quick Actions */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/games">
            <GlassButton variant="primary" fullWidth icon={Calendar}>
              View Games
            </GlassButton>
          </Link>
          <Link href="/players">
            <GlassButton variant="secondary" fullWidth icon={Users}>
              Manage Players
            </GlassButton>
          </Link>
          <Link href="/leaderboard">
            <GlassButton variant="success" fullWidth icon={Trophy}>
              Leaderboards
            </GlassButton>
          </Link>
          <Link href="/rules">
            <GlassButton variant="warning" fullWidth icon={Target}>
              Rules & Points
            </GlassButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}