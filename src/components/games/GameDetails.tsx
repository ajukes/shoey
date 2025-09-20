'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Trophy, Target, Star, Edit, Save, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';

interface GameDetails {
  id: string;
  dateTime: string;
  gameTime: string;
  meetTime: string;
  venue: string;
  address?: string;
  kit: 'HOME' | 'AWAY';
  opponent?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  team: {
    id: string;
    name: string;
    avatar?: string;
    club: {
      name: string;
    };
  };
  playerStats: Array<{
    id: string;
    goalsScored: number;
    goalAssists: number;
    greenCards: number;
    yellowCards: number;
    redCards: number;
    saves?: number;
    tackles?: number;
    passes?: number;
    played: boolean;
    player: {
      id: string;
      fullName: string;
      nickname?: string;
      avatar?: string;
      playingPosition: {
        name: string;
        category: string;
      };
    };
  }>;
  rulePoints: Array<{
    id: string;
    points: number;
    isManual: boolean;
    notes?: string;
    player: {
      id: string;
      fullName: string;
      nickname?: string;
    };
    rule: {
      id: string;
      name: string;
      pointsAwarded: number;
    };
  }>;
}

interface GameDetailsProps {
  gameId: string;
  onClose?: () => void;
}

export function GameDetails({ gameId, onClose }: GameDetailsProps) {
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingScores, setEditingScores] = useState(false);
  const [scores, setScores] = useState({ goalsFor: '', goalsAgainst: '' });

  useEffect(() => {
    fetchGameDetails();
  }, [gameId]);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/games/${gameId}`);
      if (response.ok) {
        const gameData = await response.json();
        setGame(gameData);
        setScores({
          goalsFor: gameData.goalsFor?.toString() || '',
          goalsAgainst: gameData.goalsAgainst?.toString() || ''
        });
      } else {
        console.error('Failed to fetch game details');
      }
    } catch (error) {
      console.error('Error fetching game details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateScores = async () => {
    if (!game) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalsFor: scores.goalsFor ? parseInt(scores.goalsFor) : null,
          goalsAgainst: scores.goalsAgainst ? parseInt(scores.goalsAgainst) : null,
          status: 'COMPLETED'
        }),
      });

      if (response.ok) {
        await fetchGameDetails();
        setEditingScores(false);
      }
    } catch (error) {
      console.error('Error updating scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'text-blue-400 bg-blue-400/20';
      case 'IN_PROGRESS': return 'text-yellow-400 bg-yellow-400/20';
      case 'COMPLETED': return 'text-green-400 bg-green-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getKitColor = (kit: string) => {
    return kit === 'HOME' ? 'text-green-400 bg-green-400/20' : 'text-orange-400 bg-orange-400/20';
  };

  const calculatePlayerPoints = (playerId: string) => {
    if (!game) return 0;
    return game.rulePoints
      .filter(rp => rp.player.id === playerId)
      .reduce((total, rp) => total + rp.points, 0);
  };

  if (loading && !game) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="text-white/60">Loading game details...</div>
      </GlassCard>
    );
  }

  if (!game) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="text-white/60">Game not found</div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard>
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {game.team.name} vs {game.opponent || 'TBD'}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(game.status)}`}>
                {game.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getKitColor(game.kit)}`}>
                {game.kit} KIT
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                <span>{formatDate(game.dateTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-green-400" />
                <span>Game: {game.gameTime} | Meet: {game.meetTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-purple-400" />
                <span>{game.venue}</span>
              </div>
            </div>

            {game.address && (
              <div className="text-white/60 text-sm">
                <MapPin size={14} className="inline mr-1" />
                {game.address}
              </div>
            )}
          </div>

          {onClose && (
            <GlassButton
              variant="glass"
              size="sm"
              iconOnly
              icon={X}
              onClick={onClose}
            />
          )}
        </div>
      </GlassCard>

      {/* Score Card */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="text-yellow-400" size={20} />
            Match Result
          </h2>

          {game.status !== 'CANCELLED' && (
            <GlassButton
              variant={editingScores ? "success" : "glass"}
              size="sm"
              icon={editingScores ? Save : Edit}
              onClick={editingScores ? updateScores : () => setEditingScores(true)}
              loading={loading}
            >
              {editingScores ? 'Save' : 'Edit Score'}
            </GlassButton>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">{game.team.name}</div>
            <div className="text-white/60">{game.team.club.name}</div>
          </div>

          <div className="text-center">
            {editingScores ? (
              <div className="flex items-center justify-center gap-4">
                <GlassInput
                  type="number"
                  value={scores.goalsFor}
                  onChange={(e) => setScores(prev => ({ ...prev, goalsFor: e.target.value }))}
                  className="w-16 text-center"
                  min="0"
                />
                <span className="text-white text-2xl">-</span>
                <GlassInput
                  type="number"
                  value={scores.goalsAgainst}
                  onChange={(e) => setScores(prev => ({ ...prev, goalsAgainst: e.target.value }))}
                  className="w-16 text-center"
                  min="0"
                />
              </div>
            ) : (
              <div className="text-4xl font-bold text-white">
                {game.goalsFor !== null && game.goalsAgainst !== null
                  ? `${game.goalsFor} - ${game.goalsAgainst}`
                  : '- - -'
                }
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {game.opponent || 'TBD'}
            </div>
            <div className="text-white/60">Opposition</div>
          </div>
        </div>
      </GlassCard>

      {/* Player Statistics */}
      {game.playerStats.length > 0 && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="text-blue-400" size={20} />
            Player Statistics
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/80 py-3 px-2">Player</th>
                  <th className="text-center text-white/80 py-3 px-2">Goals</th>
                  <th className="text-center text-white/80 py-3 px-2">Assists</th>
                  <th className="text-center text-white/80 py-3 px-2">Cards</th>
                  <th className="text-center text-white/80 py-3 px-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {game.playerStats.map((stat) => (
                  <tr key={stat.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {stat.player.avatar && (
                          <img
                            src={stat.player.avatar}
                            alt={stat.player.fullName}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium text-white">
                            {stat.player.nickname || stat.player.fullName}
                          </div>
                          <div className="text-xs text-white/60">
                            {stat.player.playingPosition.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 text-white">
                      {stat.goalsScored}
                    </td>
                    <td className="text-center py-3 px-2 text-white">
                      {stat.goalAssists}
                    </td>
                    <td className="text-center py-3 px-2">
                      <div className="flex justify-center gap-1">
                        {stat.greenCards > 0 && (
                          <span className="text-green-400 text-xs">G{stat.greenCards}</span>
                        )}
                        {stat.yellowCards > 0 && (
                          <span className="text-yellow-400 text-xs">Y{stat.yellowCards}</span>
                        )}
                        {stat.redCards > 0 && (
                          <span className="text-red-400 text-xs">R{stat.redCards}</span>
                        )}
                        {stat.greenCards === 0 && stat.yellowCards === 0 && stat.redCards === 0 && (
                          <span className="text-white/40 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className="font-bold text-purple-400">
                        {calculatePlayerPoints(stat.player.id)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Rule Points Breakdown */}
      {game.rulePoints.length > 0 && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="text-purple-400" size={20} />
            Points Breakdown
          </h2>

          <div className="space-y-3">
            {game.rulePoints.map((rulePoint) => (
              <div key={rulePoint.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {rulePoint.player.nickname || rulePoint.player.fullName}
                    </span>
                    {rulePoint.isManual && (
                      <Star size={14} className="text-yellow-400" title="Manual assignment" />
                    )}
                  </div>
                  <div className="text-sm text-white/60">
                    {rulePoint.rule.name}
                  </div>
                  {rulePoint.notes && (
                    <div className="text-xs text-white/50 mt-1">
                      {rulePoint.notes}
                    </div>
                  )}
                </div>
                <div className={`font-bold px-3 py-1 rounded ${
                  rulePoint.points > 0
                    ? 'text-green-400 bg-green-400/20'
                    : 'text-red-400 bg-red-400/20'
                }`}>
                  {rulePoint.points > 0 ? '+' : ''}{rulePoint.points}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}