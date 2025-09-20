'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Trophy, TrendingUp, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTable } from '@/components/ui/GlassTable';
import { GlassInput } from '@/components/ui/GlassInput';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';

interface Season {
  id: string;
  name: string;
  year: string;
  sport: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    leagues: number;
  };
}

interface SeasonFormData {
  name: string;
  year: string;
  sport: string;
  startDate: string;
  endDate: string;
}

interface SeasonManagementProps {
  onSelectSeason?: (season: Season) => void;
}

export function SeasonManagement({ onSelectSeason }: SeasonManagementProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SeasonFormData>({
    name: '',
    year: '',
    sport: 'Hockey',
    startDate: '',
    endDate: ''
  });

  // Fetch seasons on component mount
  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seasons');
      if (response.ok) {
        const seasons = await response.json();
        // Transform date strings to Date objects safely
        const transformedSeasons = seasons.map((season: any) => ({
          ...season,
          startDate: season.startDate ? new Date(season.startDate) : new Date(),
          endDate: season.endDate ? new Date(season.endDate) : new Date(),
          createdAt: season.createdAt ? new Date(season.createdAt) : new Date(),
          updatedAt: season.updatedAt ? new Date(season.updatedAt) : new Date()
        }));
        setSeasons(transformedSeasons);
      } else {
        console.error('Failed to fetch seasons');
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSeason(null);
    const currentYear = new Date().getFullYear();
    setFormData({
      name: `${currentYear}/${(currentYear + 1).toString().slice(-2)} Hockey Season`,
      year: `${currentYear}/${(currentYear + 1).toString().slice(-2)}`,
      sport: 'Hockey',
      startDate: `${currentYear}-09-01`,
      endDate: `${currentYear + 1}-05-31`
    });
    setShowForm(true);
  };

  const handleEdit = (season: Season) => {
    setEditingSeason(season);
    setFormData({
      name: season.name,
      year: season.year,
      sport: season.sport,
      startDate: season.startDate.toISOString().split('T')[0],
      endDate: season.endDate.toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Season name is required');
      return;
    }
    if (!formData.year.trim()) {
      alert('Season year is required');
      return;
    }
    if (!formData.sport.trim()) {
      alert('Sport is required');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert('Start and end dates are required');
      return;
    }

    try {
      if (editingSeason) {
        // Update existing season
        const response = await fetch(`/api/seasons/${editingSeason.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const updatedSeason = await response.json();
          const transformedSeason = {
            ...updatedSeason,
            startDate: new Date(updatedSeason.startDate),
            endDate: new Date(updatedSeason.endDate),
            createdAt: new Date(updatedSeason.createdAt),
            updatedAt: new Date(updatedSeason.updatedAt)
          };
          setSeasons(prev => prev.map(s => s.id === editingSeason.id ? transformedSeason : s));
        } else {
          const error = await response.json();
          alert('Error updating season: ' + error.error);
          return;
        }
      } else {
        // Create new season
        const response = await fetch('/api/seasons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newSeason = await response.json();
          const transformedSeason = {
            ...newSeason,
            startDate: new Date(newSeason.startDate),
            endDate: new Date(newSeason.endDate),
            createdAt: new Date(newSeason.createdAt),
            updatedAt: new Date(newSeason.updatedAt)
          };
          setSeasons(prev => [...prev, transformedSeason]);
        } else {
          const error = await response.json();
          alert('Error creating season: ' + error.error);
          return;
        }
      }

      setShowForm(false);
      setEditingSeason(null);
    } catch (error) {
      console.error('Error saving season:', error);
      alert('Error saving season');
    }
  };

  const handleDelete = async (seasonId: string) => {
    const season = seasons.find(s => s.id === seasonId);
    if (!season) return;

    if (confirm(`Are you sure you want to delete season "${season.year}"? This will also delete all associated leagues and data.`)) {
      try {
        const response = await fetch(`/api/seasons/${seasonId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSeasons(prev => prev.filter(s => s.id !== seasonId));
        } else {
          const error = await response.json();
          alert('Error deleting season: ' + error.error);
        }
      } catch (error) {
        console.error('Error deleting season:', error);
        alert('Error deleting season');
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

  const getSeasonStatus = (season: Season) => {
    const now = new Date();
    if (now < season.startDate) return { text: 'Upcoming', color: 'text-blue-400 bg-blue-400/20' };
    if (now > season.endDate) return { text: 'Finished', color: 'text-red-400 bg-red-400/20' };
    return { text: 'Active', color: 'text-green-400 bg-green-400/20' };
  };

  const columns = [
    {
      key: 'name' as keyof Season,
      header: 'Season',
      render: (value: any, season: Season) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <Calendar className="text-orange-400" size={16} />
          </div>
          <div>
            <div className="font-medium text-white">{season.name}</div>
            <div className="text-xs text-white/60">{season.year} • {season.sport}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status' as keyof Season,
      header: 'Status',
      render: (value: any, season: Season) => {
        const status = getSeasonStatus(season);
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
            {status.text}
          </span>
        );
      }
    },
    {
      key: '_count' as keyof Season,
      header: 'Leagues',
      render: (value: any, season: Season) => (
        <div className="flex items-center space-x-2">
          <Trophy size={14} className="text-purple-400" />
          <span className="font-medium text-purple-400">{season._count?.leagues || 0}</span>
        </div>
      )
    },
    {
      key: 'duration' as keyof Season,
      header: 'Duration',
      render: (value: any, season: Season) => {
        const diffTime = Math.abs(season.endDate.getTime() - season.startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.round(diffDays / 30);
        return (
          <div className="text-white/80 text-sm">
            {months} months
          </div>
        );
      },
      mobileHidden: true
    },
    {
      key: 'actions' as keyof Season,
      header: 'Actions',
      render: (value: any, season: Season) => (
        <div className="flex space-x-2">
          <GlassButton
            size="xs"
            iconOnly
            icon={Edit}
            onClick={() => handleEdit(season)}
          />
          <GlassButton
            size="xs"
            variant="danger"
            iconOnly
            icon={Trash2}
            onClick={() => handleDelete(season.id)}
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
              {editingSeason ? 'Edit Season' : 'Create New Season'}
            </h2>
            <GlassButton
              variant="glass"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </GlassButton>
          </div>

          <div className="space-y-4">
            <GlassInput
              label="Season Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., 2025/26 Hockey Season"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <GlassInput
                label="Season Year"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                placeholder="e.g., 2025/26"
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
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <GlassInput
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />

              <GlassInput
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <GlassButton variant="glass" onClick={() => setShowForm(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handleSave}>
              {editingSeason ? 'Update' : 'Create'} Season
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  const activeSeasons = seasons.filter(s => getSeasonStatus(s).text === 'Active').length;
  const upcomingSeasons = seasons.filter(s => getSeasonStatus(s).text === 'Upcoming').length;
  const totalLeagues = seasons.reduce((sum, s) => sum + (s._count?.leagues || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Season Management</h1>
          <p className="text-white/60">Manage sports seasons and their timeframes</p>
        </div>
        <GlassButton variant="primary" icon={Plus} onClick={handleCreate}>
          Create Season
        </GlassButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-orange-400">{seasons.length}</div>
          <div className="text-xs text-white/60">Total Seasons</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-400">{activeSeasons}</div>
          <div className="text-xs text-white/60">Active</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-blue-400">{upcomingSeasons}</div>
          <div className="text-xs text-white/60">Upcoming</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-purple-400">{totalLeagues}</div>
          <div className="text-xs text-white/60">Total Leagues</div>
        </GlassCard>
      </div>

      {/* Seasons Table */}
      {loading ? (
        <GlassCard className="text-center py-12">
          <div className="text-white/60">Loading seasons...</div>
        </GlassCard>
      ) : (
        <GlassTable
          data={seasons}
          columns={columns}
          mobileCardView={true}
          onRowClick={onSelectSeason}
        />
      )}

      {/* Quick Actions */}
      <GlassCard>
        <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={handleCreate}>
            <Calendar className="text-orange-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">New Season</div>
            <div className="text-xs text-white/60">Create a new sports season</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <TrendingUp className="text-green-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">Analytics</div>
            <div className="text-xs text-white/60">View season performance</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <Activity className="text-purple-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">Archive</div>
            <div className="text-xs text-white/60">Manage old seasons</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}