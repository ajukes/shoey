'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, Users, Crown, Trophy, Calendar, X, Target } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTable } from '@/components/ui/GlassTable';
import { GlassInput } from '@/components/ui/GlassInput';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface Team {
  id: string;
  name: string;
  avatar?: string;
  club: {
    id: string;
    name: string;
    avatar?: string;
  };
  leagues: {
    id: string;
    name: string;
    sport: string;
  }[];
  playersCount: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamFormData {
  name: string;
  avatar: string;
  clubId: string;
  leagueIds: string[];
  defaultRulesProfileId: string;
}

interface TeamManagementProps {
  onSelectTeam?: (team: Team) => void;
  clubId?: string;
  leagueId?: string;
}

export function TeamManagement({ onSelectTeam, clubId, leagueId }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [rulesProfiles, setRulesProfiles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    avatar: '',
    clubId: clubId || '',
    leagueIds: leagueId ? [leagueId] : [],
    defaultRulesProfileId: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchTeams();
    fetchClubs();
    fetchLeagues();
  }, [clubId, leagueId]);

  // Fetch rules profiles when club changes
  useEffect(() => {
    if (formData.clubId) {
      fetchRulesProfiles(formData.clubId);
    }
  }, [formData.clubId]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (clubId) params.append('clubId', clubId);
      if (leagueId) params.append('leagueId', leagueId);
      
      const response = await fetch(`/api/teams?${params}`);
      if (response.ok) {
        const teams = await response.json();
        setTeams(teams);
      } else {
        console.error('Failed to fetch teams');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      if (response.ok) {
        const clubs = await response.json();
        setClubs(clubs);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/leagues');
      if (response.ok) {
        const leagues = await response.json();
        setLeagues(leagues);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const fetchRulesProfiles = async (clubId: string) => {
    try {
      const response = await fetch(`/api/rules-profiles?clubId=${clubId}`);
      if (response.ok) {
        const profiles = await response.json();
        setRulesProfiles(profiles);
      } else {
        setRulesProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching rules profiles:', error);
      setRulesProfiles([]);
    }
  };

  // Note: Using ImageUploader instead of emoji options now

  const handleCreate = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      avatar: '',
      clubId: clubId || '',
      leagueIds: leagueId ? [leagueId] : [],
      defaultRulesProfileId: ''
    });
    setShowForm(true);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      avatar: team.avatar || '',
      clubId: team.club.id,
      leagueIds: team.leagues.map(league => league.id),
      defaultRulesProfileId: (team as any).defaultRulesProfile?.id || ''
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Team name is required');
      return;
    }
    if (!formData.clubId) {
      alert('Please select a club');
      return;
    }
    if (formData.leagueIds.length === 0) {
      alert('Please select at least one league');
      return;
    }

    const selectedClub = clubs.find(c => c.id === formData.clubId);
    const selectedLeagues = leagues.filter(l => formData.leagueIds.includes(l.id));

    if (!selectedClub || selectedLeagues.length !== formData.leagueIds.length) {
      alert('Invalid club or league selection');
      return;
    }

    try {
      if (editingTeam) {
        // Update existing team
        const response = await fetch(`/api/teams/${editingTeam.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const updatedTeam = await response.json();
          setTeams(prev => prev.map(t => t.id === editingTeam.id ? updatedTeam : t));
        } else {
          const error = await response.json();
          alert('Error updating team: ' + error.error);
          return;
        }
      } else {
        // Create new team
        const response = await fetch('/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newTeam = await response.json();
          setTeams(prev => [...prev, newTeam]);
        } else {
          const error = await response.json();
          alert('Error creating team: ' + error.error);
          return;
        }
      }

      setShowForm(false);
      setEditingTeam(null);
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Error saving team');
    }
  };

  const handleDelete = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    if (confirm(`Are you sure you want to delete "${team.name}"? This will also delete all associated players, games, and data.`)) {
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setTeams(prev => prev.filter(t => t.id !== teamId));
        } else {
          const error = await response.json();
          alert('Error deleting team: ' + error.error);
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Error deleting team');
      }
    }
  };

  const calculateWinRate = (team: Team) => {
    if (team.gamesPlayed === 0) return 0;
    return Math.round((team.wins / team.gamesPlayed) * 100);
  };

  const getPerformanceColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-400';
    if (winRate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const columns = [
    {
      key: 'name' as keyof Team,
      header: 'Team',
      render: (value: any, team: Team) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg overflow-hidden">
            {team.avatar ? (
              team.avatar.startsWith('data:image') ? (
                <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <span>{team.avatar}</span>
              )
            ) : team.club.avatar ? (
              team.club.avatar.startsWith('data:image') ? (
                <img src={team.club.avatar} alt={team.club.name} className="w-full h-full object-cover" />
              ) : (
                <span>{team.club.avatar}</span>
              )
            ) : (
              <Shield className="text-white/60" size={20} />
            )}
          </div>
          <div>
            <div className="font-medium text-white">{team.name}</div>
            <div className="text-xs text-white/60">{team.club.name}</div>
          </div>
        </div>
      )
    },
    {
      key: 'leagues' as keyof Team,
      header: 'Leagues',
      render: (value: any, team: Team) => (
        <div className="text-white/80">
          {team.leagues.length > 0 ? (
            <div className="space-y-1">
              {team.leagues.map((league, index) => (
                <div key={league.id} className={index > 0 ? 'text-xs' : ''}>
                  <div className="font-medium">{league.name}</div>
                  <div className="text-xs text-white/60">{league.sport}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/40 italic">No leagues</div>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'rulesProfile' as keyof Team,
      header: 'Rules Profile',
      render: (value: any, team: Team) => (
        <div className="text-white/80">
          {(team as any).defaultRulesProfile ? (
            <div className="flex items-center space-x-2">
              <Target size={14} className={`${(team as any).defaultRulesProfile.isClubDefault ? 'text-blue-400' : 'text-purple-400'}`} />
              <div>
                <div className="font-medium">{(team as any).defaultRulesProfile.name}</div>
                {(team as any).defaultRulesProfile.isClubDefault && (
                  <div className="text-xs text-blue-400">Club Default</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-white/40 italic">No profile set</div>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'playersCount' as keyof Team,
      header: 'Players',
      render: (value: any, team: Team) => (
        <div className="flex items-center space-x-2">
          <Users size={14} className="text-blue-400" />
          <span className="font-medium text-blue-400">{team.playersCount}</span>
        </div>
      )
    },
    {
      key: 'record' as keyof Team,
      header: 'Record',
      render: (value: any, team: Team) => (
        <div className="text-sm">
          <div className="text-white font-medium">
            {team.wins}W-{team.losses}L-{team.draws}D
          </div>
          <div className="text-white/60">{team.gamesPlayed} games</div>
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'performance' as keyof Team,
      header: 'Performance',
      render: (value: any, team: Team) => (
        <div className="text-sm">
          <div className={`font-medium ${getPerformanceColor(calculateWinRate(team))}`}>
            {calculateWinRate(team)}% win rate
          </div>
          <div className="text-white/60">{team.points} points</div>
        </div>
      )
    },
    {
      key: 'actions' as keyof Team,
      header: 'Actions',
      render: (value: any, team: Team) => (
        <div className="flex space-x-2">
          <GlassButton
            size="xs"
            iconOnly
            icon={Edit}
            onClick={() => handleEdit(team)}
          />
          <GlassButton
            size="xs"
            variant="danger"
            iconOnly
            icon={Trash2}
            onClick={() => handleDelete(team.id)}
          />
        </div>
      )
    }
  ];

  if (showForm) {
    return (
      <GlassCard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </h2>
            <GlassButton 
              variant="glass" 
              onClick={() => setShowForm(false)}
            >
              Cancel
            </GlassButton>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <GlassInput
                label="Team Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lions First Team"
              />

              <ImageUploader
                label="Team Avatar"
                value={formData.avatar}
                onChange={(base64) => setFormData(prev => ({ ...prev, avatar: base64 }))}
                maxSizeMB={0.25}
                avatarSize={80}
                round={true}
              />
            </div>

            <div className="space-y-4">
              <EnhancedGlassDropdown
                label="Club"
                value={formData.clubId}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    clubId: value as string,
                    defaultRulesProfileId: '' // Reset rules profile when club changes
                  }));
                }}
                options={clubs.map(club => ({
                  value: club.id,
                  label: club.name,
                  description: 'Sports club',
                  icon: Shield,
                  color: 'primary'
                }))}
                placeholder="Select a club..."
                modal
                disabled={!!clubId}
              />

              <EnhancedGlassDropdown
                label="Rules Profile"
                value={formData.defaultRulesProfileId}
                onChange={(value) => setFormData(prev => ({ ...prev, defaultRulesProfileId: value as string }))}
                options={rulesProfiles.map(profile => ({
                  value: profile.id,
                  label: profile.name,
                  description: profile.isClubDefault ? 'Club Default' : `${profile._count?.rules || 0} rules`,
                  icon: Target,
                  color: profile.isClubDefault ? 'blue' : 'purple'
                }))}
                placeholder="Select rules profile (optional)..."
                modal
                disabled={!formData.clubId || rulesProfiles.length === 0}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Leagues *
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {leagues.map(league => (
                    <label key={league.id} className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.leagueIds.includes(league.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              leagueIds: [...prev.leagueIds, league.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              leagueIds: prev.leagueIds.filter(id => id !== league.id)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                        disabled={leagueId === league.id}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">{league.name}</div>
                        <div className="text-xs text-white/60">{league.sport}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {formData.leagueIds.length === 0 && (
                  <div className="text-red-400 text-xs">Please select at least one league</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <GlassButton variant="glass" onClick={() => setShowForm(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handleSave}>
              {editingTeam ? 'Update' : 'Create'} Team
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  const totalGames = teams.reduce((sum, t) => sum + t.gamesPlayed, 0);
  const totalWins = teams.reduce((sum, t) => sum + t.wins, 0);
  const avgWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Teams {clubId || leagueId ? (clubId ? 'for Club' : 'in League') : ''}
          </h1>
          <p className="text-white/60">Manage teams and their performance</p>
        </div>
        <GlassButton variant="primary" icon={Plus} onClick={handleCreate}>
          Create Team
        </GlassButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-blue-400">{teams.length}</div>
          <div className="text-xs text-white/60">Total Teams</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {teams.reduce((sum, t) => sum + t.playersCount, 0)}
          </div>
          <div className="text-xs text-white/60">Total Players</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-purple-400">{totalGames}</div>
          <div className="text-xs text-white/60">Games Played</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className={`text-2xl font-bold ${getPerformanceColor(avgWinRate)}`}>
            {avgWinRate}%
          </div>
          <div className="text-xs text-white/60">Avg Win Rate</div>
        </GlassCard>
      </div>

      {/* Teams Table */}
      {loading ? (
        <GlassCard className="text-center py-12">
          <div className="text-white/60">Loading teams...</div>
        </GlassCard>
      ) : (
        <GlassTable
          data={teams}
          columns={columns}
          mobileCardView={true}
          onRowClick={onSelectTeam}
        />
      )}

      {/* Quick Actions */}
      <GlassCard>
        <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={handleCreate}>
            <Shield className="text-blue-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">New Team</div>
            <div className="text-xs text-white/60">Create a new team</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <Users className="text-green-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">Player Management</div>
            <div className="text-xs text-white/60">Add and manage players</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <Calendar className="text-purple-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">Schedule Games</div>
            <div className="text-xs text-white/60">Plan fixtures and matches</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}