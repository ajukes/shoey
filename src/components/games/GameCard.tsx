'use client';

import React from 'react';
import {
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Play,
  CheckCircle,
  UserPlus,
  Trophy,
  Home,
  Plane
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

interface Game {
  id: string;
  dateTime: string;
  gameTime: string;
  meetTime: string;
  venue: string;
  address?: string;
  kit: 'HOME' | 'AWAY';
  homeAway: 'HOME' | 'AWAY';
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
  _count: {
    playerStats: number;
    gamePlayers: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface GameCardProps {
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
  onSquadSelection: (game: Game) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onCompleteGame: (game: Game) => void;
  onLiveScore: (game: Game) => void;
}

export function GameCard({
  game,
  onEdit,
  onDelete,
  onSquadSelection,
  onStatusUpdate,
  onCompleteGame,
  onLiveScore
}: GameCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  return (
    <GlassCard className="p-4 hover:bg-white/5 transition-colors">
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-blue-400 flex-shrink-0" />
              <span className="font-semibold text-white text-sm truncate">
                {formatDate(game.dateTime)}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(game.status)}`}>
                {game.status.replace('_', ' ')}
              </span>
            </div>
            <div className="text-xs text-white/60 truncate">
              {game.team?.name} • {game.team?.club?.name}
            </div>
          </div>

          {/* Score/Status Display */}
          <div className="text-right ml-2">
            {game.status === 'COMPLETED' && game.goalsFor !== null && game.goalsAgainst !== null ? (
              <div className="font-bold text-white text-lg">
                {game.goalsFor} - {game.goalsAgainst}
              </div>
            ) : game.status === 'IN_PROGRESS' ? (
              <div
                className="cursor-pointer hover:bg-white/10 rounded px-2 py-1 transition-colors"
                onClick={() => onLiveScore(game)}
              >
                <div className="font-bold text-yellow-400 text-lg">
                  {game.goalsFor || 0} - {game.goalsAgainst || 0}
                </div>
                <div className="text-xs text-yellow-400/60">Tap to update</div>
              </div>
            ) : (
              <div className="text-white/40 text-sm">vs</div>
            )}
          </div>
        </div>

        {/* Game Details Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-white/60" />
              <span className="text-white/80">{game.gameTime}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <MapPin size={14} className="text-white/60 flex-shrink-0" />
              <span className="text-white/80 truncate">{game.venue}</span>
            </div>
          </div>
        </div>

        {/* Opponent and Kit Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {game.opponent ? (
              <span className="text-white font-medium truncate">vs {game.opponent}</span>
            ) : (
              <span className="text-white/60 text-sm">Opponent TBD</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1">
              {game.homeAway === 'HOME' ? (
                <Home size={14} className="text-green-400" />
              ) : (
                <Plane size={14} className="text-orange-400" />
              )}
              <span className="text-xs text-white/60">{game.homeAway}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getKitColor(game.kit)}`}>
              {game.kit}
            </span>
          </div>
        </div>

        {/* Squad and Actions Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users size={14} className="text-blue-400" />
              <span className="text-blue-400 font-medium text-sm">{game._count?.gamePlayers || 0}</span>
              <span className="text-white/60 text-xs">squad</span>
            </div>

            <GlassButton
              variant="glass"
              size="xs"
              icon={UserPlus}
              onClick={() => onSquadSelection(game)}
            >
              {game._count?.gamePlayers > 0 ? 'Edit Squad' : 'Select Squad'}
            </GlassButton>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {game.status === 'SCHEDULED' && (
              <GlassButton
                variant="glass"
                size="xs"
                iconOnly
                icon={Play}
                onClick={() => onStatusUpdate(game.id, 'IN_PROGRESS')}
                title="Start Game"
              />
            )}
            {game.status === 'IN_PROGRESS' && (
              <GlassButton
                variant="success"
                size="xs"
                iconOnly
                icon={CheckCircle}
                onClick={() => onCompleteGame(game)}
                title="Complete Game"
              />
            )}
            <GlassButton
              variant="glass"
              size="xs"
              iconOnly
              icon={Edit}
              onClick={() => onEdit(game)}
              title="Edit Game"
            />
            <GlassButton
              variant="danger"
              size="xs"
              iconOnly
              icon={Trash2}
              onClick={() => onDelete(game.id)}
              title="Delete Game"
            />
          </div>
        </div>

        {/* Address Row (if available) */}
        {game.address && (
          <div className="text-xs text-white/50 truncate pt-1">
            📍 {game.address}
          </div>
        )}
      </div>
    </GlassCard>
  );
}