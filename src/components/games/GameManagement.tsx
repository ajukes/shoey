'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Users, Trophy, X, Play, Pause, CheckCircle, UserPlus, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTable } from '@/components/ui/GlassTable';
import { GlassInput } from '@/components/ui/GlassInput';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';
import { SquadSelection } from './SquadSelection';
import { SquadDisplay } from './SquadDisplay';
import { GameCompletionModal } from './GameCompletionModal';
import { LiveScoreModal } from './LiveScoreModal';

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

interface GameFormData {
  date: string;
  gameTime: string;
  meetTime: string;
  venue: string;
  address: string;
  kit: 'HOME' | 'AWAY';
  homeAway: 'HOME' | 'AWAY';
  opponent: string;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
  club: {
    name: string;
  };
}

export function GameManagement() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showSquadSelection, setShowSquadSelection] = useState(false);
  const [selectedGameForSquad, setSelectedGameForSquad] = useState<Game | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedGameForCompletion, setSelectedGameForCompletion] = useState<Game | null>(null);
  const [showLiveScoreModal, setShowLiveScoreModal] = useState(false);
  const [selectedGameForScore, setSelectedGameForScore] = useState<Game | null>(null);
  const [formData, setFormData] = useState<GameFormData>({
    date: '',
    gameTime: '',
    meetTime: '',
    venue: '',
    address: '',
    kit: 'HOME',
    homeAway: 'HOME',
    opponent: '',
    teamId: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchGames();
    fetchTeams();
  }, [statusFilter]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/games?${params}`);
      if (response.ok) {
        const games = await response.json();
        setGames(games);
      } else {
        console.error('Failed to fetch games');
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const teams = await response.json();
        setTeams(teams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const url = editingGame ? `/api/games/${editingGame.id}` : '/api/games';
      const method = editingGame ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchGames();
        resetForm();
      } else {
        const error = await response.json();
        console.error('Failed to save game:', error);
      }
    } catch (error) {
      console.error('Error saving game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setFormData({
      date: game.dateTime.split('T')[0], // Extract date part
      gameTime: game.gameTime,
      meetTime: game.meetTime,
      venue: game.venue,
      address: game.address || '',
      kit: game.kit,
      homeAway: game.homeAway,
      opponent: game.opponent || '',
      teamId: game.team.id
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/games/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchGames();
      } else {
        console.error('Failed to delete game');
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (completedGame: any) => {
    await fetchGames();
    setShowCompletionModal(false);
    setSelectedGameForCompletion(null);
  };

  const handleCancelCompletion = () => {
    setShowCompletionModal(false);
    setSelectedGameForCompletion(null);
  };

  const handleLiveScoreSave = async (goalsFor: number, goalsAgainst: number) => {
    if (!selectedGameForScore) return;

    try {
      const response = await fetch(`/api/games/${selectedGameForScore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goalsFor, goalsAgainst }),
      });

      if (response.ok) {
        await fetchGames();
        setShowLiveScoreModal(false);
        setSelectedGameForScore(null);
      } else {
        console.error('Failed to update score');
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const updateGameStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/games/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchGames();
      }
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      gameTime: '',
      meetTime: '',
      venue: '',
      address: '',
      kit: 'HOME',
      homeAway: 'HOME',
      opponent: '',
      teamId: ''
    });
    setEditingGame(null);
    setShowForm(false);
  };

  const handleSquadSelection = (game: Game) => {
    setSelectedGameForSquad(game);
    setShowSquadSelection(true);
  };

  const handleSquadSave = async (selectedPlayerIds: string[]) => {
    if (!selectedGameForSquad) return;

    try {
      const response = await fetch(`/api/games/${selectedGameForSquad.id}/squad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerIds: selectedPlayerIds }),
      });

      if (response.ok) {
        // Refresh games to update squad counts
        await fetchGames();
        setShowSquadSelection(false);
        setSelectedGameForSquad(null);
      } else {
        console.error('Failed to save squad');
      }
    } catch (error) {
      console.error('Error saving squad:', error);
    }
  };

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

  const statusOptions = [
    { value: '', label: 'All Games', icon: Calendar, color: 'default' },
    { value: 'SCHEDULED', label: 'Scheduled', icon: Calendar, color: 'primary' },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: Play, color: 'warning' },
    { value: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: 'success' },
    { value: 'CANCELLED', label: 'Cancelled', icon: X, color: 'danger' },
  ];

  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.name,
    description: team.club.name,
    icon: Trophy,
    color: 'success'
  }));

  const kitOptions = [
    { value: 'HOME', label: 'Home Kit', icon: Users, color: 'success' },
    { value: 'AWAY', label: 'Away Kit', icon: Users, color: 'warning' },
  ];

  const homeAwayOptions = [
    { value: 'HOME', label: 'Home Game', icon: Users, color: 'success' },
    { value: 'AWAY', label: 'Away Game', icon: Users, color: 'warning' },
  ];

  const columns = [
    {
      key: 'dateTime',
      header: 'Date',
      render: (value: any, game: Game) => {
        if (!game || !game.dateTime) {
          return <div className="text-white/60">Invalid game data</div>;
        }
        return (
          <div className="space-y-1">
            <div className="font-medium text-white">{formatDate(game.dateTime)}</div>
            <div className="text-xs text-white/60 flex items-center gap-1">
              <Clock size={12} />
              Game: {game.gameTime || 'TBD'}
            </div>
            <div className="text-xs text-white/60 flex items-center gap-1">
              <Users size={12} />
              Meet: {game.meetTime || 'TBD'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'venue',
      header: 'Venue',
      render: (value: any, game: Game) => {
        if (!game) {
          return <div className="text-white/60">-</div>;
        }
        return (
          <div className="space-y-1">
            <div className="font-medium text-white">{game.venue || 'TBD'}</div>
            {game.address && (
              <div className="text-xs text-white/60 flex items-center gap-1">
                <MapPin size={12} />
                {game.address}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'opponent',
      header: 'Details',
      render: (value: any, game: Game) => {
        if (!game) {
          return <div className="text-white/60">-</div>;
        }
        return (
          <div className="space-y-2">
            {game.opponent && (
              <div className="text-sm text-white">vs {game.opponent}</div>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getKitColor(game.kit || 'HOME')}`}>
                {game.kit || 'HOME'}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(game.status || 'SCHEDULED')}`}>
                {(game.status || 'SCHEDULED').replace('_', ' ')}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'goalsFor',
      header: 'Score',
      render: (value: any, game: Game) => {
        if (!game) {
          return <div className="text-white/60">-</div>;
        }
        return (
          <div className="space-y-1">
            {game.status === 'COMPLETED' && game.goalsFor !== null && game.goalsAgainst !== null ? (
              <div className="font-bold text-white text-lg">
                {game.goalsFor} - {game.goalsAgainst}
              </div>
            ) : game.status === 'IN_PROGRESS' ? (
              <div
                className="cursor-pointer hover:bg-white/10 rounded p-2 transition-colors"
                onClick={() => {
                  setSelectedGameForScore(game);
                  setShowLiveScoreModal(true);
                }}
              >
                <div className="font-bold text-yellow-400 text-lg">
                  {game.goalsFor || 0} - {game.goalsAgainst || 0}
                </div>
                <div className="text-xs text-yellow-400/60">Click to update</div>
              </div>
            ) : (
              <div className="text-white/60 text-sm">-</div>
            )}
            <div className="text-xs text-white/60">{game.team?.name || 'Unknown Team'}</div>
          </div>
        );
      }
    },
    {
      key: '_count',
      header: 'Squad',
      render: (value: any, game: Game) => {
        if (!game) {
          return <div className="text-white/60">-</div>;
        }
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users size={14} className="text-blue-400" />
              <span className="font-medium text-blue-400">{game._count?.gamePlayers || 0}</span>
            </div>
            <GlassButton
              variant="glass"
              size="xs"
              icon={UserPlus}
              onClick={() => handleSquadSelection(game)}
            >
              {game._count?.gamePlayers > 0 ? 'Edit' : 'Select'}
            </GlassButton>
          </div>
        );
      }
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value: any, game: Game) => {
        if (!game || !game.id) {
          return <div className="text-white/60">-</div>;
        }
        return (
          <div className="flex space-x-2">
            {game.status === 'SCHEDULED' && (
              <GlassButton
                variant="glass"
                size="sm"
                iconOnly
                icon={Play}
                onClick={() => updateGameStatus(game.id, 'IN_PROGRESS')}
                title="Start Game"
              />
            )}
            {game.status === 'IN_PROGRESS' && (
              <GlassButton
                variant="success"
                size="sm"
                iconOnly
                icon={CheckCircle}
                onClick={() => {
                  setSelectedGameForCompletion(game);
                  setShowCompletionModal(true);
                }}
                title="Complete Game"
              />
            )}
            {game.status === 'COMPLETED' && (
              <GlassButton
                variant="warning"
                size="sm"
                iconOnly
                icon={RotateCcw}
                onClick={() => {
                  setSelectedGameForCompletion(game);
                  setShowCompletionModal(true);
                }}
                title="Re-complete Game"
              />
            )}
            <GlassButton
              variant="glass"
              size="sm"
              iconOnly
              icon={Edit}
              onClick={() => handleEdit(game)}
            />
            <GlassButton
              variant="danger"
              size="sm"
              iconOnly
              icon={Trash2}
              onClick={() => handleDelete(game.id)}
            />
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Games Management
          </h1>
          <p className="text-white/60">
            Schedule and manage team games
          </p>
        </div>

        <div className="flex items-center gap-3">
          <EnhancedGlassDropdown
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as string)}
            options={statusOptions}
            placeholder="Filter by status..."
            modal={false}
          />

          <GlassButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            Add Game
          </GlassButton>
        </div>
      </div>

      {/* Games Table */}
      <GlassCard>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-white/60">Loading games...</div>
          </div>
        ) : (
          <GlassTable
            data={games}
            columns={columns}
          />
        )}
      </GlassCard>

      {/* Game Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingGame ? 'Edit Game' : 'Add New Game'}
              </h2>
              <GlassButton
                variant="glass"
                size="sm"
                iconOnly
                icon={X}
                onClick={resetForm}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <GlassInput
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />

                <EnhancedGlassDropdown
                  label="Team"
                  value={formData.teamId}
                  onChange={(value) => setFormData(prev => ({ ...prev, teamId: value as string }))}
                  options={teamOptions}
                  placeholder="Select team..."
                  modal
                  required
                />

                <GlassInput
                  label="Game Time"
                  type="time"
                  value={formData.gameTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, gameTime: e.target.value }))}
                  required
                />

                <GlassInput
                  label="Meet Time"
                  type="time"
                  value={formData.meetTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetTime: e.target.value }))}
                  required
                />

                <GlassInput
                  label="Venue"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="Enter venue name..."
                  required
                />

                <EnhancedGlassDropdown
                  label="Home/Away"
                  value={formData.homeAway}
                  onChange={(value) => setFormData(prev => ({ ...prev, homeAway: value as 'HOME' | 'AWAY' }))}
                  options={homeAwayOptions}
                  placeholder="Select venue type..."
                  modal={false}
                />

                <EnhancedGlassDropdown
                  label="Kit"
                  value={formData.kit}
                  onChange={(value) => setFormData(prev => ({ ...prev, kit: value as 'HOME' | 'AWAY' }))}
                  options={kitOptions}
                  placeholder="Select kit..."
                  modal={false}
                />
              </div>

              <GlassInput
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter full venue address..."
              />

              <GlassInput
                label="Opponent"
                value={formData.opponent}
                onChange={(e) => setFormData(prev => ({ ...prev, opponent: e.target.value }))}
                placeholder="Enter opponent team name..."
              />

              <div className="flex justify-end space-x-3 pt-4">
                <GlassButton
                  variant="glass"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  type="submit"
                  loading={loading}
                >
                  {editingGame ? 'Update Game' : 'Create Game'}
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Squad Selection Modal */}
      {showSquadSelection && selectedGameForSquad && (
        <SquadSelection
          gameId={selectedGameForSquad.id}
          teamId={selectedGameForSquad.team.id}
          isOpen={showSquadSelection}
          onClose={() => setShowSquadSelection(false)}
          onSave={handleSquadSave}
        />
      )}

      {/* Game Completion Modal */}
      {showCompletionModal && selectedGameForCompletion && (
        <GameCompletionModal
          game={selectedGameForCompletion}
          onComplete={handleGameComplete}
          onCancel={handleCancelCompletion}
        />
      )}

      {/* Live Score Modal */}
      {showLiveScoreModal && selectedGameForScore && (
        <LiveScoreModal
          game={selectedGameForScore}
          isOpen={showLiveScoreModal}
          onClose={() => {
            setShowLiveScoreModal(false);
            setSelectedGameForScore(null);
          }}
          onSave={handleLiveScoreSave}
        />
      )}
    </div>
  );
}