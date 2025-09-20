'use client';

import { Edit, Trash2, Shield, Users, Target } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

interface RulesProfileCardProps {
  profile: {
    id: string;
    name: string;
    description?: string;
    isClubDefault: boolean;
    isActive: boolean;
    club: {
      id: string;
      name: string;
    };
    rules: Array<{
      id: string;
      ruleId: string;
      customPoints?: number;
      isEnabled: boolean;
      rule: {
        id: string;
        name: string;
        description?: string;
        category: string;
        pointsAwarded: number;
      };
    }>;
    teams: Array<{
      id: string;
      name: string;
    }>;
    _count: {
      rules: number;
      teams: number;
    };
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function RulesProfileCard({ profile, onEdit, onDelete }: RulesProfileCardProps) {
  const enabledRules = profile.rules.filter(r => r.isEnabled);
  const totalCustomPoints = enabledRules.reduce((sum, rule) => {
    return sum + (rule.customPoints || rule.rule.pointsAwarded);
  }, 0);

  return (
    <GlassCard className="p-6 hover:bg-white/[0.08] transition-all duration-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
            {profile.isClubDefault && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                <Shield className="w-3 h-3" />
                Default
              </div>
            )}
          </div>
          <p className="text-sm text-white/60">{profile.club.name}</p>
          {profile.description && (
            <p className="text-sm text-white/50 mt-1">{profile.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-lg font-bold text-white">{enabledRules.length}</div>
          <div className="text-xs text-white/50">Active Rules</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white">{profile._count.teams}</div>
          <div className="text-xs text-white/50">Teams</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <span className="text-yellow-400 font-bold text-sm">Σ</span>
          </div>
          <div className="text-lg font-bold text-white">{totalCustomPoints}</div>
          <div className="text-xs text-white/50">Total Pts</div>
        </div>
      </div>

      {/* Teams Using This Profile */}
      <div className="flex-1 mb-4">
        {profile.teams.length > 0 ? (
          <div>
            <div className="text-xs text-white/50 mb-1">Used by teams</div>
            <div className="text-xs text-white/60">
              {profile.teams.map(team => team.name).join(', ')}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs text-white/50 mb-1">Usage</div>
            <div className="text-xs text-white/40">No teams assigned</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/10 mt-auto">
        <GlassButton
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 text-sm"
        >
          <Edit className="w-3 h-3" />
          Edit
        </GlassButton>
        {!profile.isClubDefault && (
          <GlassButton
            onClick={onDelete}
            variant="danger"
            className="flex items-center justify-center gap-2 text-sm px-3"
          >
            <Trash2 className="w-3 h-3" />
          </GlassButton>
        )}
      </div>

      {/* Status Indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-2 h-2 rounded-full ${profile.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
      </div>
    </GlassCard>
  );
}