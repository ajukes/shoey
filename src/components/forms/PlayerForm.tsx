'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlayerRole } from '@prisma/client';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassSelect } from '@/components/ui/GlassSelect';
import { GlassButton } from '@/components/ui/GlassButton';
import { Mail, Phone, User, Building2, Users, Target } from 'lucide-react';

interface Club {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  clubId: string;
}

interface Position {
  id: string;
  name: string;
  category: string;
}

interface PlayerFormProps {
  player?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function PlayerForm({ player, onSubmit, onCancel, loading = false }: PlayerFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    fullName: player?.fullName || '',
    nickname: player?.nickname || '',
    email: player?.email || '',
    mobileNumber: player?.mobileNumber || '',
    role: player?.role || PlayerRole.PLAYER,
    clubId: player?.clubId || '',
    teamId: player?.teamId || '',
    playingPositionId: player?.playingPositionId || '',
  });

  const [clubs, setClubs] = useState<Club[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAdmin = session?.user?.player?.role === PlayerRole.ADMIN;
  const userClubId = session?.user?.player?.clubId;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.clubId) {
      fetchTeamsByClub(formData.clubId);
    } else {
      setTeams([]);
      setFormData(prev => ({ ...prev, teamId: '' }));
    }
  }, [formData.clubId]);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [clubsRes, positionsRes] = await Promise.all([
        fetch('/api/clubs'),
        fetch('/api/positions')
      ]);

      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        setClubs(clubsData);

        // If user is not admin, auto-select their club
        if (!isAdmin && userClubId && !player) {
          setFormData(prev => ({ ...prev, clubId: userClubId }));
        }
      }

      if (positionsRes.ok) {
        const positionsData = await positionsRes.json();
        setPositions(positionsData);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTeamsByClub = async (clubId: string) => {
    try {
      const response = await fetch(`/api/teams?clubId=${clubId}`);
      if (response.ok) {
        const teamsData = await response.json();
        setTeams(teamsData);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.clubId) {
      newErrors.clubId = 'Club selection is required';
    }

    if (!formData.teamId) {
      newErrors.teamId = 'Team selection is required';
    }

    if (!formData.playingPositionId) {
      newErrors.playingPositionId = 'Position selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const roleOptions = [
    { value: PlayerRole.PLAYER, label: 'Player' },
    { value: PlayerRole.CAPTAIN, label: 'Captain' },
    { value: PlayerRole.MANAGER, label: 'Manager' },
    ...(isAdmin ? [{ value: PlayerRole.ADMIN, label: 'Admin' }] : []),
  ];

  const clubOptions = clubs.map(club => ({
    value: club.id,
    label: club.name,
  }));

  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.name,
  }));

  const positionOptions = positions.map(position => ({
    value: position.id,
    label: position.name,
  }));

  if (loadingData) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60">Loading form data...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassInput
            label="Full Name *"
            icon={User}
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            error={errors.fullName}
            placeholder="Enter full name"
          />

          <GlassInput
            label="Nickname"
            value={formData.nickname}
            onChange={(e) => handleInputChange('nickname', e.target.value)}
            placeholder="Enter nickname (optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassInput
            label="Email"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            placeholder="Enter email address (optional)"
          />

          <GlassInput
            label="Mobile Number"
            type="tel"
            icon={Phone}
            value={formData.mobileNumber}
            onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
            placeholder="Enter mobile number (optional)"
          />
        </div>
      </div>

      {/* Role & Team Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Role & Team Information</h3>

        <GlassSelect
          label="Role"
          value={formData.role}
          onChange={(e) => handleInputChange('role', e.target.value)}
          options={roleOptions}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassSelect
            label="Club *"
            value={formData.clubId}
            onChange={(e) => handleInputChange('clubId', e.target.value)}
            options={[
              { value: '', label: 'Select a club' },
              ...clubOptions
            ]}
            error={errors.clubId}
            disabled={!isAdmin && !!userClubId}
          />

          <GlassSelect
            label="Team *"
            value={formData.teamId}
            onChange={(e) => handleInputChange('teamId', e.target.value)}
            options={[
              { value: '', label: 'Select a team' },
              ...teamOptions
            ]}
            error={errors.teamId}
            disabled={!formData.clubId}
          />
        </div>

        <GlassSelect
          label="Playing Position *"
          value={formData.playingPositionId}
          onChange={(e) => handleInputChange('playingPositionId', e.target.value)}
          options={[
            { value: '', label: 'Select a position' },
            ...positionOptions
          ]}
          error={errors.playingPositionId}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col md:flex-row gap-3 pt-4">
        <GlassButton
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
          className="flex-1"
        >
          {player ? 'Update Player' : 'Create Player'}
        </GlassButton>

        <GlassButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </GlassButton>
      </div>
    </form>
  );
}