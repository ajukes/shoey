'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Users, Building2, Medal, Crown, TrendingUp, Filter } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';
import { TeamLeaderboard } from './TeamLeaderboard';
import { ClubLeaderboard } from './ClubLeaderboard';

interface Team {
  id: string;
  name: string;
  club: {
    id: string;
    name: string;
  };
}

interface Season {
  id: string;
  name: string;
  year: string;
  sport: string;
}

type LeaderboardType = 'team' | 'club';

export function LeaderboardManagement() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('team');
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [teamsRes, seasonsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/seasons')
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        setSeasons(seasonsData);
        // Auto-select current season
        const currentSeason = seasonsData.find((s: Season) => {
          const now = new Date();
          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          return now >= start && now <= end;
        });
        if (currentSeason) {
          setSelectedSeason(currentSeason.id);
        } else if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const leaderboardTypeOptions = [
    {
      value: 'team',
      label: 'Team Leaderboard',
      description: 'Points within team rules profiles',
      icon: Users,
      color: 'primary'
    },
    {
      value: 'club',
      label: 'Club Leaderboard',
      description: 'Points within club rules profiles',
      icon: Building2,
      color: 'success'
    },
  ];

  const teamOptions = [
    { value: '', label: 'All Teams', icon: Users, color: 'default' },
    ...teams.map(team => ({
      value: team.id,
      label: team.name,
      description: team.club.name,
      icon: Trophy,
      color: 'primary'
    }))
  ];

  const seasonOptions = [
    { value: '', label: 'All Seasons', icon: TrendingUp, color: 'default' },
    ...seasons.map(season => ({
      value: season.id,
      label: season.name,
      description: season.year,
      icon: Medal,
      color: 'success'
    }))
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-white/60 mb-2">Loading leaderboards...</div>
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="text-yellow-400" size={32} />
            Leaderboards
          </h1>
          <p className="text-white/60">
            View player rankings and performance statistics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <EnhancedGlassDropdown
            value={leaderboardType}
            onChange={(value) => setLeaderboardType(value as LeaderboardType)}
            options={leaderboardTypeOptions}
            placeholder="Select leaderboard type..."
            modal={false}
          />
        </div>
      </div>

      {/* Filters */}
      <GlassCard padding="sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex items-center gap-2 text-white/80">
            <Filter size={16} />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <EnhancedGlassDropdown
              value={selectedSeason}
              onChange={(value) => setSelectedSeason(value as string)}
              options={seasonOptions}
              placeholder="Filter by season..."
              modal={false}
              className="flex-1"
            />

            {leaderboardType === 'team' && (
              <EnhancedGlassDropdown
                value={selectedTeam}
                onChange={(value) => setSelectedTeam(value as string)}
                options={teamOptions}
                placeholder="Filter by team..."
                modal={false}
                className="flex-1"
              />
            )}
          </div>

          <GlassButton
            variant="glass"
            size="sm"
            onClick={() => {
              setSelectedTeam('');
              setSelectedSeason('');
            }}
          >
            Clear Filters
          </GlassButton>
        </div>
      </GlassCard>

      {/* Leaderboard Content */}
      {leaderboardType === 'team' ? (
        <TeamLeaderboard
          selectedTeam={selectedTeam}
          selectedSeason={selectedSeason}
        />
      ) : (
        <ClubLeaderboard
          selectedSeason={selectedSeason}
        />
      )}
    </div>
  );
}