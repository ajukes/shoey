'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Building2, TrendingUp, Calendar, Target } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface ClubLeaderboardEntry {
  playerId: string;
  fullName: string;
  nickname?: string;
  clubName: string;
  teamName: string;
  position?: {
    name: string;
    category: string;
  };
  totalPoints: number;
  gamesPlayed: number;
  pointsPerGame: number;
  rank: number;
  recentForm: number; // Last 5 games average
}

interface ClubLeaderboardProps {
  selectedSeason: string;
}

export function ClubLeaderboard({ selectedSeason }: ClubLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<ClubLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubLeaderboard();
  }, [selectedSeason]);

  const fetchClubLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('pointType', 'CLUB');
      if (selectedSeason) params.append('seasonId', selectedSeason);

      const response = await fetch(`/api/leaderboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      } else {
        console.error('Failed to fetch club leaderboard');
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Error fetching club leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="text-yellow-400" size={20} />;
      case 2: return <Medal className="text-gray-300" size={20} />;
      case 3: return <Award className="text-amber-600" size={20} />;
      default: return <span className="text-white/60 font-bold text-sm w-5 text-center">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400/20 border-yellow-400/30';
      case 2: return 'bg-gray-300/20 border-gray-300/30';
      case 3: return 'bg-amber-600/20 border-amber-600/30';
      default: return '';
    }
  };

  // Group players by club for club-wide stats
  const clubStats = leaderboard.reduce((acc, player) => {
    if (!acc[player.clubName]) {
      acc[player.clubName] = {
        totalPoints: 0,
        playerCount: 0,
        avgPointsPerPlayer: 0,
        topPlayer: player
      };
    }

    acc[player.clubName].totalPoints += player.totalPoints;
    acc[player.clubName].playerCount += 1;
    acc[player.clubName].avgPointsPerPlayer = acc[player.clubName].totalPoints / acc[player.clubName].playerCount;

    // Track top player for this club
    if (player.totalPoints > acc[player.clubName].topPlayer.totalPoints) {
      acc[player.clubName].topPlayer = player;
    }

    return acc;
  }, {} as Record<string, any>);

  if (loading) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <div className="text-white/60 mb-2">Loading club leaderboard...</div>
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </GlassCard>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <Building2 className="mx-auto text-white/40 mb-4" size={48} />
          <div className="text-white/60 mb-2">No club leaderboard data available</div>
          <div className="text-white/40 text-sm">
            Complete some games to see club-wide player rankings
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Club Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(clubStats).map(([clubName, stats]) => (
          <GlassCard key={clubName} padding="sm">
            <div className="text-center">
              <Building2 className="text-blue-400 mx-auto mb-2" size={24} />
              <div className="font-medium text-white text-sm truncate mb-1">
                {clubName}
              </div>
              <div className="text-xs text-white/60 mb-2">
                {stats.playerCount} players
              </div>
              <div className="text-lg font-bold text-blue-400">
                {stats.totalPoints}
              </div>
              <div className="text-xs text-white/60">
                {stats.avgPointsPerPlayer.toFixed(1)} avg per player
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd Place */}
          <GlassCard padding="sm" className="bg-gray-300/10 border-gray-300/30">
            <div className="text-center">
              <Medal className="text-gray-300 mx-auto mb-2" size={24} />
              <div className="text-sm font-medium text-white truncate">
                {leaderboard[1]?.nickname || leaderboard[1]?.fullName}
              </div>
              <div className="text-xs text-white/60 truncate">{leaderboard[1]?.clubName}</div>
              <div className="text-xs text-white/40 truncate">{leaderboard[1]?.teamName}</div>
              <div className="text-lg font-bold text-gray-300 mt-1">
                {leaderboard[1]?.totalPoints}
              </div>
            </div>
          </GlassCard>

          {/* 1st Place */}
          <GlassCard padding="sm" className="bg-yellow-400/20 border-yellow-400/30 scale-110">
            <div className="text-center">
              <Trophy className="text-yellow-400 mx-auto mb-2" size={28} />
              <div className="text-sm font-medium text-white truncate">
                {leaderboard[0]?.nickname || leaderboard[0]?.fullName}
              </div>
              <div className="text-xs text-white/60 truncate">{leaderboard[0]?.clubName}</div>
              <div className="text-xs text-white/40 truncate">{leaderboard[0]?.teamName}</div>
              <div className="text-xl font-bold text-yellow-400 mt-1">
                {leaderboard[0]?.totalPoints}
              </div>
            </div>
          </GlassCard>

          {/* 3rd Place */}
          <GlassCard padding="sm" className="bg-amber-600/20 border-amber-600/30">
            <div className="text-center">
              <Award className="text-amber-600 mx-auto mb-2" size={24} />
              <div className="text-sm font-medium text-white truncate">
                {leaderboard[2]?.nickname || leaderboard[2]?.fullName}
              </div>
              <div className="text-xs text-white/60 truncate">{leaderboard[2]?.clubName}</div>
              <div className="text-xs text-white/40 truncate">{leaderboard[2]?.teamName}</div>
              <div className="text-lg font-bold text-amber-600 mt-1">
                {leaderboard[2]?.totalPoints}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Full Club Leaderboard */}
      <GlassCard>
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Building2 size={20} />
              Club-Wide Rankings
            </h3>
            <div className="text-sm text-white/60">
              {leaderboard.length} players across all clubs
            </div>
          </div>

          <div className="space-y-2">
            {leaderboard.map((player) => (
              <GlassCard
                key={player.playerId}
                padding="sm"
                className={`hover:bg-white/5 transition-colors ${getRankColor(player.rank)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-10 flex justify-center">
                      {getRankIcon(player.rank)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm truncate">
                          {player.nickname || player.fullName}
                        </span>
                        {player.rank <= 3 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">
                            TOP {player.rank}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/60 truncate">
                        {player.clubName} • {player.teamName}
                      </div>
                      <div className="text-xs text-white/40 truncate">
                        {player.position?.name || 'Unknown Position'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {player.totalPoints}
                      </div>
                      <div className="text-xs text-white/60">
                        {player.pointsPerGame.toFixed(1)} avg
                      </div>
                    </div>

                    <div className="text-xs text-white/60 min-w-[60px]">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {player.gamesPlayed} games
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Target size={12} />
                        {player.recentForm.toFixed(1)} form
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}