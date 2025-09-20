'use client';

import React, { useState, useEffect } from 'react';
import { Users, Edit, UserPlus, Trophy, Shield } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

interface SquadPlayer {
  id: string;
  playerId: string;
  player: {
    id: string;
    fullName: string;
    nickname?: string;
    avatar?: string;
    role: string;
    playingPosition: {
      id: string;
      name: string;
      category: string;
    };
  };
}

interface SquadDisplayProps {
  gameId: string;
  teamId: string;
  onEditSquad: () => void;
  className?: string;
}

export function SquadDisplay({ gameId, teamId, onEditSquad, className = '' }: SquadDisplayProps) {
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchSquad();
    }
  }, [gameId]);

  const fetchSquad = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/games/${gameId}/squad`);
      if (response.ok) {
        const squadData = await response.json();
        setSquad(squadData);
      } else {
        console.error('Failed to fetch squad');
      }
    } catch (error) {
      console.error('Error fetching squad:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (category: string) => {
    switch (category) {
      case 'GOALKEEPER': return 'text-purple-400 bg-purple-400/20';
      case 'DEFENDER': return 'text-blue-400 bg-blue-400/20';
      case 'MIDFIELDER': return 'text-green-400 bg-green-400/20';
      case 'FORWARD': return 'text-red-400 bg-red-400/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CAPTAIN': return 'text-yellow-400 bg-yellow-400/20';
      case 'MANAGER': return 'text-orange-400 bg-orange-400/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const groupedSquad = squad.reduce((acc, squadPlayer) => {
    const category = squadPlayer.player.playingPosition.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(squadPlayer);
    return acc;
  }, {} as Record<string, SquadPlayer[]>);

  const positionOrder = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];

  return (
    <GlassCard className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Users className="text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Squad</h3>
            <p className="text-white/60 text-sm">{squad.length} players selected</p>
          </div>
        </div>
        <GlassButton
          variant="primary"
          icon={squad.length === 0 ? UserPlus : Edit}
          onClick={onEditSquad}
          size="sm"
        >
          {squad.length === 0 ? 'Select Squad' : 'Edit Squad'}
        </GlassButton>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-white/60">Loading squad...</div>
        </div>
      ) : squad.length === 0 ? (
        <div className="text-center py-8">
          <Users className="mx-auto text-white/40 mb-4" size={48} />
          <div className="text-white/60 mb-2">No squad selected</div>
          <div className="text-white/40 text-sm">Click "Select Squad" to choose players for this game</div>
        </div>
      ) : (
        <div className="space-y-6">
          {positionOrder.map(position => {
            const playersInPosition = groupedSquad[position];
            if (!playersInPosition || playersInPosition.length === 0) return null;

            return (
              <div key={position} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getPositionColor(position)}`}>
                    {position.charAt(0) + position.slice(1).toLowerCase()}s
                  </div>
                  <div className="text-white/40 text-sm">
                    ({playersInPosition.length})
                  </div>
                </div>

                <div className="grid gap-3">
                  {playersInPosition.map(squadPlayer => (
                    <div
                      key={squadPlayer.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden">
                          {squadPlayer.player.avatar ? (
                            <img
                              src={squadPlayer.player.avatar}
                              alt={squadPlayer.player.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="text-blue-400" size={16} />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-white">{squadPlayer.player.fullName}</h4>
                            {squadPlayer.player.nickname && (
                              <span className="text-sm text-white/60">({squadPlayer.player.nickname})</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(squadPlayer.player.playingPosition.category)}`}>
                              {squadPlayer.player.playingPosition.name}
                            </span>
                            {squadPlayer.player.role !== 'PLAYER' && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(squadPlayer.player.role)}`}>
                                {squadPlayer.player.role === 'CAPTAIN' && <Shield size={12} className="inline mr-1" />}
                                {squadPlayer.player.role === 'MANAGER' && <Trophy size={12} className="inline mr-1" />}
                                {squadPlayer.player.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}