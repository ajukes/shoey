'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Trophy, Calendar, Users, MapPin } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTable } from '@/components/ui/GlassTable';
import { GlassInput } from '@/components/ui/GlassInput';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface League {
  id: string;
  name: string;
  sport: string;
  season: {
    id: string;
    name: string;
    year: string;
    sport: string;
    startDate: Date;
    endDate: Date;
  };
  location?: string;
  image?: string;
  teamsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LeagueFormData {
  name: string;
  sport: string;
  seasonId: string;
  location: string;
  image: string;
}

interface LeagueManagementProps {
  onSelectLeague?: (league: League) => void;
}

export function LeagueManagement({ onSelectLeague }: LeagueManagementProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LeagueFormData>({
    name: '',
    sport: 'Hockey',
    seasonId: '',
    location: '',
    image: ''
  });

  // Fetch leagues and seasons on component mount
  useEffect(() => {
    fetchLeagues();
    fetchSeasons();
  }, []);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leagues');
      if (response.ok) {
        const leagues = await response.json();
        // Transform date strings to Date objects safely
        const transformedLeagues = leagues.map((league: any) => ({
          ...league,
          season: {
            ...league.season,
            startDate: league.season?.startDate ? new Date(league.season.startDate) : new Date(),
            endDate: league.season?.endDate ? new Date(league.season.endDate) : new Date()
          },
          createdAt: league.createdAt ? new Date(league.createdAt) : new Date(),
          updatedAt: league.updatedAt ? new Date(league.updatedAt) : new Date()
        }));
        setLeagues(transformedLeagues);
      } else {
        console.error('Failed to fetch leagues - Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/seasons');
      if (response.ok) {
        const seasons = await response.json();
        setSeasons(seasons);
        // Auto-select current season if available
        if (seasons.length > 0 && !formData.seasonId) {
          const currentYear = new Date().getFullYear();
          const currentSeason = seasons.find((s: any) =>
            s.year.includes(currentYear.toString())
          ) || seasons[0];
          setFormData(prev => ({ ...prev, seasonId: currentSeason.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const handleCreate = () => {
    setEditingLeague(null);
    const currentYear = new Date().getFullYear();
    const currentSeason = seasons.find((s: any) =>
      s.year.includes(currentYear.toString())
    ) || seasons[0];
    setFormData({
      name: '',
      sport: 'Hockey',
      seasonId: currentSeason?.id || '',
      location: '',
      image: ''
    });
    setShowForm(true);
  };

  const handleEdit = (league: League) => {
    setEditingLeague(league);
    setFormData({
      name: league.name,
      sport: league.sport,
      seasonId: league.season.id,
      location: league.location || '',
      image: league.image || ''
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('League name is required');
      return;
    }

    try {
      if (editingLeague) {
        // Update existing league
        const response = await fetch(`/api/leagues/${editingLeague.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const updatedLeague = await response.json();
          const transformedLeague = {
            ...updatedLeague,
            season: {
              ...updatedLeague.season,
              startDate: new Date(updatedLeague.season.startDate),
              endDate: new Date(updatedLeague.season.endDate)
            },
            createdAt: new Date(updatedLeague.createdAt),
            updatedAt: new Date(updatedLeague.updatedAt)
          };
          setLeagues(prev => prev.map(l => l.id === editingLeague.id ? transformedLeague : l));
        } else {
          const error = await response.json();
          alert('Error updating league: ' + error.error);
          return;
        }
      } else {
        // Create new league
        const response = await fetch('/api/leagues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newLeague = await response.json();
          const transformedLeague = {
            ...newLeague,
            season: {
              ...newLeague.season,
              startDate: new Date(newLeague.season.startDate),
              endDate: new Date(newLeague.season.endDate)
            },
            createdAt: new Date(newLeague.createdAt),
            updatedAt: new Date(newLeague.updatedAt)
          };
          setLeagues(prev => [...prev, transformedLeague]);
        } else {
          const error = await response.json();
          alert('Error creating league: ' + error.error);
          return;
        }
      }

      setShowForm(false);
      setEditingLeague(null);
    } catch (error) {
      console.error('Error saving league:', error);
      alert('Error saving league');
    }
  };

  const handleDelete = async (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId);
    if (!league) return;

    if (confirm(`Are you sure you want to delete "${league.name}"? This will also delete all associated teams and data.`)) {
      try {
        const response = await fetch(`/api/leagues/${leagueId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setLeagues(prev => prev.filter(l => l.id !== leagueId));
        } else {
          const error = await response.json();
          alert('Error deleting league: ' + error.error);
        }
      } catch (error) {
        console.error('Error deleting league:', error);
        alert('Error deleting league');
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (league: League) => {
    const now = new Date();
    if (now < league.season.startDate) return 'text-blue-400 bg-blue-400/20';
    if (now > league.season.endDate) return 'text-red-400 bg-red-400/20';
    return 'text-green-400 bg-green-400/20';
  };

  const getStatusText = (league: League) => {
    const now = new Date();
    if (now < league.season.startDate) return 'Upcoming';
    if (now > league.season.endDate) return 'Finished';
    return 'Active';
  };

  const columns = [
    {
      key: 'name' as keyof League,
      header: 'League',
      render: (value: any, league: League) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-lg overflow-hidden">
            {league.image ? (
              <img src={league.image} alt={league.name} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="text-purple-400" size={16} />
            )}
          </div>
          <div>
            <div className="font-medium text-white">{league.name}</div>
            <div className="text-xs text-white/60">{league.sport} • {league.season.name || league.season.year}</div>
          </div>
        </div>
      )
    },
    {
      key: 'location' as keyof League,
      header: 'Location',
      render: (value: any, league: League) => (
        <div className="flex items-center space-x-2 text-white/80">
          <MapPin size={14} className="text-white/50" />
          <span>{league.location || 'Not set'}</span>
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'season' as keyof League,
      header: 'Season Dates',
      render: (value: any, league: League) => (
        <div className="text-sm text-white/80">
          <div className="flex items-center space-x-1">
            <Calendar size={12} className="text-white/50" />
            <span>{formatDate(league.season.startDate)}</span>
          </div>
          <div className="text-white/60 text-xs">to {formatDate(league.season.endDate)}</div>
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'teamsCount' as keyof League,
      header: 'Teams',
      render: (value: any, league: League) => (
        <div className="flex items-center space-x-2">
          <Users size={14} className="text-blue-400" />
          <span className="font-medium text-blue-400">{league.teamsCount}</span>
        </div>
      )
    },
    {
      key: 'status' as keyof League,
      header: 'Status',
      render: (value: any, league: League) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(league)}`}>
          {getStatusText(league)}
        </span>
      )
    },
    {
      key: 'actions' as keyof League,
      header: 'Actions',
      render: (value: any, league: League) => (
        <div className="flex space-x-2">
          <GlassButton
            size="xs"
            iconOnly
            icon={Edit}
            onClick={() => handleEdit(league)}
          />
          <GlassButton
            size="xs"
            variant="danger"
            iconOnly
            icon={Trash2}
            onClick={() => handleDelete(league.id)}
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
              {editingLeague ? 'Edit League' : 'Create New League'}
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
                label="League Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Premier Hockey League"
              />

              <EnhancedGlassDropdown
                label="Sport"
                value={formData.sport}
                onChange={(value) => setFormData(prev => ({ ...prev, sport: value as string }))}
                options={[
                  { value: 'Hockey', label: 'Hockey', icon: Trophy, color: 'primary' },
                  { value: 'Football', label: 'Football', icon: Trophy, color: 'success' },
                  { value: 'Rugby', label: 'Rugby', icon: Trophy, color: 'warning' },
                  { value: 'Basketball', label: 'Basketball', icon: Trophy, color: 'danger' },
                  { value: 'Cricket', label: 'Cricket', icon: Trophy, color: 'info' }
                ]}
                modal
              />

              <EnhancedGlassDropdown
                label="Season"
                value={formData.seasonId}
                onChange={(value) => setFormData(prev => ({ ...prev, seasonId: value as string }))}
                options={seasons.map(season => ({
                  value: season.id,
                  label: season.name || season.year,
                  description: `${season.year} • ${season.sport}`,
                  icon: Calendar,
                  color: 'info'
                }))}
                placeholder="Select a season..."
                modal
              />

              <ImageUploader
                label="League Image"
                value={formData.image}
                onChange={(base64) => setFormData(prev => ({ ...prev, image: base64 }))}
                maxSizeMB={0.25}
                avatarSize={96}
                round={false}
              />
            </div>

            <div className="space-y-4">
              <GlassInput
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., London"
              />

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-sm text-white/80">
                  <div className="font-medium text-white mb-2">Season Information</div>
                  <div className="text-xs text-white/60">
                    League dates and activity are determined by the selected season.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <GlassButton variant="glass" onClick={() => setShowForm(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handleSave}>
              {editingLeague ? 'Update' : 'Create'} League
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Leagues</h1>
          <p className="text-white/60">Manage sports leagues and competitions</p>
        </div>
        <GlassButton variant="primary" icon={Plus} onClick={handleCreate}>
          Create League
        </GlassButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-purple-400">{leagues.length}</div>
          <div className="text-xs text-white/60">Total Leagues</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {leagues.filter(l => {
              const now = new Date();
              return now >= l.season.startDate && now <= l.season.endDate;
            }).length}
          </div>
          <div className="text-xs text-white/60">Active Now</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {leagues.reduce((sum, l) => sum + l.teamsCount, 0)}
          </div>
          <div className="text-xs text-white/60">Total Teams</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {leagues.filter(l => new Date() < l.season.startDate).length}
          </div>
          <div className="text-xs text-white/60">Upcoming</div>
        </GlassCard>
      </div>

      {/* Leagues Table */}
      {loading ? (
        <GlassCard className="text-center py-12">
          <div className="text-white/60">Loading leagues...</div>
        </GlassCard>
      ) : (
        <GlassTable
          data={leagues}
          columns={columns}
          mobileCardView={true}
          onRowClick={onSelectLeague}
        />
      )}

      {/* Quick Actions */}
      <GlassCard>
        <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={handleCreate}>
            <Trophy className="text-purple-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">New League</div>
            <div className="text-xs text-white/60">Create a new sports league</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <Calendar className="text-blue-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">Season Planning</div>
            <div className="text-xs text-white/60">Plan fixtures and schedules</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <Users className="text-green-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">Team Registration</div>
            <div className="text-xs text-white/60">Manage team registrations</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}