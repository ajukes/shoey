'use client';

import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

interface Game {
  id: string;
  goalsFor?: number;
  goalsAgainst?: number;
  opponent?: string;
  kit: 'HOME' | 'AWAY';
  homeAway: 'HOME' | 'AWAY';
  team: {
    name: string;
    club: {
      name: string;
    };
  };
}

interface LiveScoreModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalsFor: number, goalsAgainst: number) => void;
}

export function LiveScoreModal({ game, isOpen, onClose, onSave }: LiveScoreModalProps) {
  const [goalsFor, setGoalsFor] = useState(game.goalsFor || 0);
  const [goalsAgainst, setGoalsAgainst] = useState(game.goalsAgainst || 0);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(goalsFor, goalsAgainst);
    onClose();
  };

  const adjustScore = (type: 'for' | 'against', delta: number) => {
    if (type === 'for') {
      setGoalsFor(Math.max(0, goalsFor + delta));
    } else {
      setGoalsAgainst(Math.max(0, goalsAgainst + delta));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Live Score</h2>
            <p className="text-white/60">Update match score in real-time</p>
          </div>
          <GlassButton
            variant="glass"
            size="sm"
            iconOnly
            icon={X}
            onClick={onClose}
          />
        </div>

        {/* Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Home Team (Our Team) */}
          <div className="text-center">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-1">
                {game.team.name}
              </h3>
              <p className="text-sm text-white/60">{game.team.club.name}</p>
              <p className={`text-xs font-medium mt-1 ${game.homeAway === 'HOME' ? 'text-green-400' : 'text-orange-400'}`}>
                {game.homeAway}
              </p>
            </div>

            {/* Goals For Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <GlassButton
                variant="danger"
                size="lg"
                iconOnly
                icon={Minus}
                onClick={() => adjustScore('for', -1)}
                disabled={goalsFor <= 0}
              />

              <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-4xl font-bold text-white">{goalsFor}</span>
              </div>

              <GlassButton
                variant="success"
                size="lg"
                iconOnly
                icon={Plus}
                onClick={() => adjustScore('for', 1)}
              />
            </div>

            <p className="text-sm text-white/60">Goals For</p>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-4">
                <span className="text-2xl font-bold text-white/60">VS</span>
              </div>
              <p className="text-sm text-white/40">Live Match</p>
            </div>
          </div>

          {/* Away Team (Opponent) */}
          <div className="text-center">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-1">
                {game.opponent || 'Opponent'}
              </h3>
              <p className="text-sm text-white/60">{game.homeAway === 'HOME' ? 'Visiting Team' : 'Home Team'}</p>
              <p className={`text-xs font-medium mt-1 ${game.homeAway === 'HOME' ? 'text-orange-400' : 'text-green-400'}`}>
                {game.homeAway === 'HOME' ? 'AWAY' : 'HOME'}
              </p>
            </div>

            {/* Goals Against Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <GlassButton
                variant="danger"
                size="lg"
                iconOnly
                icon={Minus}
                onClick={() => adjustScore('against', -1)}
                disabled={goalsAgainst <= 0}
              />

              <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-4xl font-bold text-white">{goalsAgainst}</span>
              </div>

              <GlassButton
                variant="success"
                size="lg"
                iconOnly
                icon={Plus}
                onClick={() => adjustScore('against', 1)}
              />
            </div>

            <p className="text-sm text-white/60">Goals Against</p>
          </div>
        </div>

        {/* Current Score Display */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-sm text-white/60">Current Score:</span>
            <span className="text-2xl font-bold text-white">
              {goalsFor} - {goalsAgainst}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <GlassButton
            variant="glass"
            onClick={onClose}
            className="px-8"
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            className="px-8"
          >
            Update Score
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}