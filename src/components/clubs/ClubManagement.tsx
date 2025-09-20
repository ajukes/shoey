'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Users, Shield, MapPin, Upload, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTable } from '@/components/ui/GlassTable';
import { GlassInput } from '@/components/ui/GlassInput';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface Club {
  id: string;
  name: string;
  avatar?: string;
  location?: string;
  founded?: number;
  description?: string;
  teamsCount: number;
  playersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ClubFormData {
  name: string;
  avatar: string;
  location: string;
  founded: string;
  description: string;
}

interface ClubManagementProps {
  onSelectClub?: (club: Club) => void;
}

export function ClubManagement({ onSelectClub }: ClubManagementProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    avatar: '',
    location: '',
    founded: '',
    description: ''
  });

  // Fetch clubs on component mount
  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clubs');
      if (response.ok) {
        const clubs = await response.json();
        setClubs(clubs);
      } else {
        console.error('Failed to fetch clubs');
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Note: Using ImageUploader instead of emoji options now

  const handleCreate = () => {
    setEditingClub(null);
    setFormData({
      name: '',
      avatar: '',
      location: '',
      founded: '',
      description: ''
    });
    setShowForm(true);
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      avatar: club.avatar || '',
      location: club.location || '',
      founded: club.founded?.toString() || '',
      description: club.description || ''
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Club name is required');
      return;
    }

    try {
      if (editingClub) {
        // Update existing club
        const response = await fetch(`/api/clubs/${editingClub.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const updatedClub = await response.json();
          setClubs(prev => prev.map(c => c.id === editingClub.id ? updatedClub : c));
        } else {
          const error = await response.json();
          alert('Error updating club: ' + error.error);
          return;
        }
      } else {
        // Create new club
        const response = await fetch('/api/clubs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newClub = await response.json();
          setClubs(prev => [...prev, newClub]);
        } else {
          const error = await response.json();
          alert('Error creating club: ' + error.error);
          return;
        }
      }

      setShowForm(false);
      setEditingClub(null);
    } catch (error) {
      console.error('Error saving club:', error);
      alert('Error saving club');
    }
  };

  const handleDelete = async (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    if (!club) return;

    if (confirm(`Are you sure you want to delete "${club.name}"? This will also delete all associated teams and players.`)) {
      try {
        const response = await fetch(`/api/clubs/${clubId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setClubs(prev => prev.filter(c => c.id !== clubId));
        } else {
          const error = await response.json();
          alert('Error deleting club: ' + error.error);
        }
      } catch (error) {
        console.error('Error deleting club:', error);
        alert('Error deleting club');
      }
    }
  };

  const columns = [
    {
      key: 'name' as keyof Club,
      header: 'Club',
      render: (value: any, club: Club) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg overflow-hidden">
            {club.avatar ? (
              club.avatar.startsWith('data:image') ? (
                <img src={club.avatar} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <span>{club.avatar}</span>
              )
            ) : (
              <Building2 className="text-white/60" size={20} />
            )}
          </div>
          <div>
            <div className="font-medium text-white">{club.name}</div>
            <div className="text-xs text-white/60">
              {club.location && (
                <span className="flex items-center space-x-1">
                  <MapPin size={10} />
                  <span>{club.location}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'founded' as keyof Club,
      header: 'Founded',
      render: (value: any, club: Club) => (
        <div className="text-white/80">
          {club.founded ? (
            <span>{club.founded} ({new Date().getFullYear() - club.founded} years)</span>
          ) : (
            <span className="text-white/40">Not set</span>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'teamsCount' as keyof Club,
      header: 'Teams',
      render: (value: any, club: Club) => (
        <div className="flex items-center space-x-2">
          <Shield size={14} className="text-blue-400" />
          <span className="font-medium text-blue-400">{club.teamsCount}</span>
        </div>
      )
    },
    {
      key: 'playersCount' as keyof Club,
      header: 'Players',
      render: (value: any, club: Club) => (
        <div className="flex items-center space-x-2">
          <Users size={14} className="text-green-400" />
          <span className="font-medium text-green-400">{club.playersCount}</span>
        </div>
      )
    },
    {
      key: 'actions' as keyof Club,
      header: 'Actions',
      render: (value: any, club: Club) => (
        <div className="flex space-x-2">
          <GlassButton
            size="xs"
            iconOnly
            icon={Edit}
            onClick={() => handleEdit(club)}
          />
          <GlassButton
            size="xs"
            variant="danger"
            iconOnly
            icon={Trash2}
            onClick={() => handleDelete(club.id)}
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
              {editingClub ? 'Edit Club' : 'Create New Club'}
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
                label="Club Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lions Hockey Club"
              />

              <ImageUploader
                label="Club Avatar"
                value={formData.avatar}
                onChange={(base64) => setFormData(prev => ({ ...prev, avatar: base64 }))}
                maxSizeMB={0.25}
                avatarSize={80}
                round={true}
              />

              <GlassInput
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., London"
              />
            </div>

            <div className="space-y-4">
              <GlassInput
                label="Founded Year"
                type="number"
                value={formData.founded}
                onChange={(e) => setFormData(prev => ({ ...prev, founded: e.target.value }))}
                placeholder="e.g., 1985"
                min="1800"
                max={new Date().getFullYear().toString()}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the club..."
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:border-white/40 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <GlassButton variant="glass" onClick={() => setShowForm(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handleSave}>
              {editingClub ? 'Update' : 'Create'} Club
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
          <h1 className="text-2xl font-bold text-white">Clubs</h1>
          <p className="text-white/60">Manage sports clubs and organizations</p>
        </div>
        <GlassButton variant="primary" icon={Plus} onClick={handleCreate}>
          Create Club
        </GlassButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-blue-400">{clubs.length}</div>
          <div className="text-xs text-white/60">Total Clubs</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {clubs.reduce((sum, c) => sum + c.teamsCount, 0)}
          </div>
          <div className="text-xs text-white/60">Total Teams</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {clubs.reduce((sum, c) => sum + c.playersCount, 0)}
          </div>
          <div className="text-xs text-white/60">Total Players</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {Math.round(clubs.reduce((sum, c, _, arr) => {
              const founded = c.founded || new Date().getFullYear();
              return sum + (new Date().getFullYear() - founded);
            }, 0) / clubs.length) || 0}
          </div>
          <div className="text-xs text-white/60">Avg Age (years)</div>
        </GlassCard>
      </div>

      {/* Clubs Table */}
      {loading ? (
        <GlassCard className="text-center py-12">
          <div className="text-white/60">Loading clubs...</div>
        </GlassCard>
      ) : (
        <GlassTable
          data={clubs}
          columns={columns}
          mobileCardView={true}
          onRowClick={onSelectClub}
        />
      )}

      {/* Quick Actions */}
      <GlassCard>
        <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={handleCreate}>
            <Building2 className="text-blue-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">New Club</div>
            <div className="text-xs text-white/60">Register a new sports club</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <Users className="text-green-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">Member Registration</div>
            <div className="text-xs text-white/60">Add players to clubs</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <Shield className="text-purple-400 mb-2" size={20} />
            <div className="font-medium text-white text-sm">Team Management</div>
            <div className="text-xs text-white/60">Create and manage teams</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}