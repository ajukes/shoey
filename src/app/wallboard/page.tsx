'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Activity,
  RefreshCw
} from 'lucide-react';

interface WallboardGame {
  id: string;
  dateTime: string;
  gameTime: string;
  venue: string;
  homeAway: 'HOME' | 'AWAY';
  opponent?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  status: string;
  team: {
    name: string;
    club: {
      name: string;
    };
  };
  playerStats: {
    player: {
      fullName: string;
      nickname?: string;
    };
    goalsScored: number;
    goalAssists: number;
  }[];
  rulePoints: {
    id: string;
    playerId: string;
    points: number;
    player: {
      fullName: string;
      nickname?: string;
    };
    rule: {
      name: string;
    };
  }[];
}

export default function WallboardPage() {
  const [games, setGames] = useState<WallboardGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(0);

  const GAMES_PER_PAGE = 8;
  const ROTATION_INTERVAL = 20000; // 20 seconds
  const REFRESH_INTERVAL = 30000; // 30 seconds

  const fetchTodaysGames = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const response = await fetch(
        `/api/games?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
      );

      if (response.ok) {
        const gamesData = await response.json();
        setGames(gamesData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching today\'s games:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(games.length / GAMES_PER_PAGE);
  const startIndex = currentPage * GAMES_PER_PAGE;
  const endIndex = startIndex + GAMES_PER_PAGE;
  const currentGames = games.slice(startIndex, endIndex);

  useEffect(() => {
    fetchTodaysGames();

    // Set up data refresh interval (30 seconds)
    const refreshInterval = setInterval(() => {
      fetchTodaysGames();
    }, REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    // Set up page rotation interval (20 seconds)
    if (totalPages > 1) {
      const rotationInterval = setInterval(() => {
        setCurrentPage(prev => {
          const nextPage = (prev + 1) % totalPages;
          // Refresh data when rotating back to first page
          if (nextPage === 0) {
            fetchTodaysGames();
          }
          return nextPage;
        });
      }, ROTATION_INTERVAL);

      return () => clearInterval(rotationInterval);
    }
  }, [totalPages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGameStatus = (game: WallboardGame) => {
    switch (game.status) {
      case 'SCHEDULED':
        return { text: 'KO ' + formatTime(game.dateTime), color: 'text-blue-400 bg-blue-400/20' };
      case 'IN_PROGRESS':
        return { text: 'LIVE', color: 'text-green-400 bg-green-400/20 animate-pulse' };
      case 'COMPLETED':
        return { text: 'FT', color: 'text-white/60 bg-white/10' };
      case 'CANCELLED':
        return { text: 'CANCELLED', color: 'text-red-400 bg-red-400/20' };
      default:
        return { text: game.status, color: 'text-white/60 bg-white/10' };
    }
  };

  const getScores = (game: WallboardGame) => {
    if (game.status === 'COMPLETED' || game.status === 'IN_PROGRESS') {
      const teamScore = game.goalsFor || 0;
      const opponentScore = game.goalsAgainst || 0;
      return { teamScore, opponentScore };
    }
    return null;
  };

  const getGameResult = (game: WallboardGame) => {
    if (game.status !== 'COMPLETED') return null;

    if (game.goalsFor! > game.goalsAgainst!) {
      return 'W';
    } else if (game.goalsFor! < game.goalsAgainst!) {
      return 'L';
    } else {
      return 'D';
    }
  };

  const getGoalScorers = (game: WallboardGame) => {
    // Get goal scoring rules (rules that contain "Goal" in the name)
    const goalRulePoints = game.rulePoints?.filter(rp =>
      rp.rule.name.toLowerCase().includes('goal')
    ) || [];

    console.log(`Game ${game.id} - Rule Points:`, game.rulePoints);
    console.log(`Goal rule points found:`, goalRulePoints);

    // Group by player and count goals (quantity of times they scored)
    const playerGoals = goalRulePoints.reduce((acc, rp) => {
      const playerId = rp.playerId;
      if (!acc[playerId]) {
        acc[playerId] = {
          player: rp.player,
          goalsScored: 0
        };
      }
      // Each goal rule point represents one goal scored
      acc[playerId].goalsScored += 1;
      return acc;
    }, {} as Record<string, { player: { fullName: string; nickname?: string; }; goalsScored: number; }>);

    // Convert to array and sort by number of goals (quantity)
    const scorers = Object.values(playerGoals).sort((a, b) => b.goalsScored - a.goalsScored);

    console.log(`Final goal scorers with quantities:`, scorers);
    return scorers;
  };

  if (loading) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
              <div className="text-white/60">Loading today's games...</div>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Live Scores
            </h1>
            <p className="text-white/60 flex items-center justify-center gap-2">
              <Calendar size={16} />
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            {/* Pagination Info */}
            {totalPages > 1 && (
              <div className="mt-3 space-y-2">
                <div className="text-sm text-white/60 flex items-center justify-center gap-2">
                  <span>Page {currentPage + 1} of {totalPages}</span>
                  <span>•</span>
                  <span>{games.length} games total</span>
                  <span>•</span>
                  <span>Auto-rotate every 20s</span>
                </div>

                {/* Page Indicators */}
                <div className="flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === currentPage
                          ? 'bg-blue-400 scale-125'
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-white/40 mt-2 flex items-center justify-center gap-1">
              <RefreshCw size={12} />
              Last updated: {lastUpdated.toLocaleTimeString('en-GB')} • Auto-refresh every 30s
            </p>
          </div>

          {/* Games Grid */}
          {games.length > 0 ? (
            <div
              key={currentPage}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in-0 duration-500"
            >
              {currentGames.map((game) => {
                const gameStatus = getGameStatus(game);
                const scores = getScores(game);
                const result = getGameResult(game);
                const goalScorers = getGoalScorers(game);

                return (
                  <GlassCard key={game.id} padding="md" className="h-full">
                    <div className="space-y-4">
                      {/* Status and Time */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${gameStatus.color}`}>
                          {gameStatus.text}
                        </span>
                        {result && (
                          <span className={`text-xs px-2 py-1 rounded font-bold ${
                            result === 'W'
                              ? 'text-green-400 bg-green-400/20'
                              : result === 'L'
                              ? 'text-red-400 bg-red-400/20'
                              : 'text-yellow-400 bg-yellow-400/20'
                          }`}>
                            {result}
                          </span>
                        )}
                      </div>

                      {/* Teams and Score */}
                      <div className="space-y-3">
                        {/* Team Names */}
                        <div className="flex items-center justify-between">
                          <div className="text-left flex-1">
                            <div className="text-xs font-medium text-white/60 mb-1">
                              {game.team.club.name}
                            </div>
                            <div className="text-sm font-bold text-white">
                              {game.team.name}
                            </div>
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-xs font-medium text-white/60 mb-1">
                              {game.opponent ? 'vs' : ''}
                            </div>
                            <div className="text-sm font-bold text-white">
                              {game.opponent || 'TBD'}
                            </div>
                          </div>
                        </div>

                        {/* Score Display */}
                        {scores ? (
                          <div className="flex items-center justify-center gap-4">
                            <div className="text-3xl font-bold text-white text-center">
                              {scores.teamScore}
                            </div>
                            <div className="text-lg text-white/60">-</div>
                            <div className="text-3xl font-bold text-white text-center">
                              {scores.opponentScore}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-lg text-white/60">
                              vs
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Venue and Details */}
                      <div className="space-y-2 text-xs text-white/60">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span className="truncate">{game.venue}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            game.homeAway === 'HOME'
                              ? 'bg-blue-400/20 text-blue-400'
                              : 'bg-orange-400/20 text-orange-400'
                          }`}>
                            {game.homeAway}
                          </span>
                        </div>
                      </div>

                      {/* Goal Scorers */}
                      {(game.status === 'COMPLETED' || game.status === 'IN_PROGRESS') && (
                        <div className="border-t border-white/10 pt-3">
                          <div className="flex items-center gap-2 text-xs mb-2">
                            <Trophy size={12} className="text-yellow-400" />
                            <span className="text-white/60">
                              {goalScorers.length === 1 ? 'Goal scorer:' : goalScorers.length > 1 ? 'Goal scorers:' : 'Scorers:'}
                            </span>
                          </div>
                          {goalScorers.length > 0 ? (
                            <div className="space-y-1">
                              {goalScorers.map((scorer, index) => (
                                <div key={index} className="text-sm text-white">
                                  <span className="font-medium">
                                    {scorer.player.nickname || scorer.player.fullName}
                                  </span>
                                  <span className="text-white/60 ml-2">
                                    ({scorer.goalsScored})
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-white/40">
                              {scores?.teamScore === 0 ? 'No goals yet' : 'Stats pending...'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Live indicator for in-progress games */}
                      {game.status === 'IN_PROGRESS' && (
                        <div className="flex items-center justify-center gap-2 text-green-400 text-xs">
                          <Activity size={12} className="animate-pulse" />
                          <span>Live Match</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Games Today</h3>
              <p className="text-white/60">
                There are no scheduled games for today. Check back tomorrow!
              </p>
            </div>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
}