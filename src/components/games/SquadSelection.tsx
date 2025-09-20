'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, UserCheck, UserX, Search, Filter } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';

interface Player {
  id: string;
  fullName: string;
  nickname?: string;
  email: string;
  avatar?: string;
  playingPosition: {
    id: string;
    name: string;
    category: string;
  };
  role: string;
}

interface SquadPlayer extends Player {
  isSelected: boolean;
  isSquad?: boolean;
}

interface SquadSelectionProps {
  gameId: string;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedPlayers: string[]) => void;
}

export function SquadSelection({ gameId, teamId, isOpen, onClose, onSave }: SquadSelectionProps) {
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    if (isOpen && teamId) {
      fetchPlayers();
      if (gameId) {
        fetchCurrentSquad();
      }
    }
  }, [isOpen, teamId, gameId]);

  useEffect(() => {
    applyFilters();
  }, [players, searchTerm, positionFilter]);

  useEffect(() => {
    setSelectedCount(players.filter(p => p.isSelected).length);
  }, [players]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}/players`);
      if (response.ok) {
        const teamPlayers = await response.json();
        setPlayers(teamPlayers.map((player: Player) => ({
          ...player,
          isSelected: false
        })));
      } else {
        console.error('Failed to fetch team players');
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSquad = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/squad`);
      if (response.ok) {
        const currentSquad = await response.json();
        const squadPlayerIds = currentSquad.map((sp: any) => sp.playerId);

        setPlayers(prev => prev.map(player => ({
          ...player,
          isSelected: squadPlayerIds.includes(player.id),
          isSquad: squadPlayerIds.includes(player.id)
        })));
      }
    } catch (error) {
      console.error('Error fetching current squad:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...players];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(player =>
        player.fullName.toLowerCase().includes(term) ||
        player.nickname?.toLowerCase().includes(term) ||
        player.email.toLowerCase().includes(term)
      );
    }

    // Position filter
    if (positionFilter) {
      filtered = filtered.filter(player =>
        player.playingPosition.category === positionFilter
      );
    }

    // Sort by: selected first, then by role priority, then by name
    filtered.sort((a, b) => {
      if (a.isSelected !== b.isSelected) {
        return a.isSelected ? -1 : 1;
      }

      const roleOrder = { 'CAPTAIN': 0, 'MANAGER': 1, 'PLAYER': 2 };
      const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
      const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 3;

      if (aRole !== bRole) {
        return aRole - bRole;
      }

      return a.fullName.localeCompare(b.fullName);
    });

    setFilteredPlayers(filtered);
  };

  const togglePlayerSelection = (playerId: string) => {
    setPlayers(prev => prev.map(player =>
      player.id === playerId
        ? { ...player, isSelected: !player.isSelected }
        : player
    ));
  };

  const selectAll = () => {
    const allSelected = filteredPlayers.every(p => p.isSelected);
    const playerIds = filteredPlayers.map(p => p.id);

    setPlayers(prev => prev.map(player =>
      playerIds.includes(player.id)
        ? { ...player, isSelected: !allSelected }
        : player
    ));
  };

  const handleSave = async () => {
    const selectedPlayerIds = players.filter(p => p.isSelected).map(p => p.id);

    try {
      setSaving(true);
      await onSave(selectedPlayerIds);
      onClose();
    } catch (error) {
      console.error('Error saving squad:', error);
    } finally {
      setSaving(false);
    }
  };

  const positionOptions = [
    { value: '', label: 'All Positions', icon: Users, color: 'default' },
    { value: 'GOALKEEPER', label: 'Goalkeeper', icon: Users, color: 'primary' },
    { value: 'DEFENDER', label: 'Defender', icon: Users, color: 'success' },
    { value: 'MIDFIELDER', label: 'Midfielder', icon: Users, color: 'warning' },
    { value: 'FORWARD', label: 'Forward', icon: Users, color: 'danger' },
  ];

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Squad Selection</h2>
            <p className="text-white/60">Select players for this game</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-white/80">
              <span className="font-medium text-green-400">{selectedCount}</span> selected
            </div>
            <GlassButton
              variant="glass"
              size="sm"
              iconOnly
              icon={X}
              onClick={onClose}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <GlassInput
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="w-full md:w-48">
              <EnhancedGlassDropdown
                value={positionFilter}
                onChange={(value) => setPositionFilter(value as string)}
                options={positionOptions}
                placeholder="Filter by position"
                modal={false}
              />
            </div>
            <GlassButton
              variant="glass"
              onClick={selectAll}
              icon={filteredPlayers.every(p => p.isSelected) ? UserX : UserCheck}
            >
              {filteredPlayers.every(p => p.isSelected) ? 'Deselect All' : 'Select All'}
            </GlassButton>
          </div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-white/60">Loading players...</div>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto text-white/40 mb-4" size={48} />
              <div className="text-white/60">No players found</div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    player.isSelected
                      ? 'bg-green-500/20 border-green-500/50 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => togglePlayerSelection(player.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden">
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="text-blue-400" size={20} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-white">{player.fullName}</h3>
                        {player.nickname && (
                          <span className="text-sm text-white/60">({player.nickname})</span>
                        )}
                        {player.isSelected && (
                          <UserCheck className="text-green-400" size={16} />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(player.playingPosition.category)}`}>
                          {player.playingPosition.name}
                        </span>
                        {player.role !== 'PLAYER' && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(player.role)}`}>
                            {player.role}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-white/60">{player.email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 flex justify-end space-x-3">
          <GlassButton
            variant="glass"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            loading={saving}
            icon={Users}
          >
            Save Squad ({selectedCount} players)
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}