'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  description: string;
  category: string;
  pointsAwarded: number;
  isMultiplier: boolean;
  targetScope: string;
  targetPositions: string[];
}

interface RulesProfileRule {
  id: string;
  ruleId: string;
  customPoints: number | null;
  isEnabled: boolean;
  rule: Rule;
}

interface RulesProfile {
  id: string;
  name: string;
  description: string | null;
  isClubDefault: boolean;
  rules: RulesProfileRule[];
  club: {
    id: string;
    name: string;
  };
}

interface SelectedRule {
  ruleId: string;
  customPoints: number | null;
  isEnabled: boolean;
}

export default function EditRulesProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<RulesProfile | null>(null);
  const [availableRules, setAvailableRules] = useState<Rule[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isClubDefault: false,
    rules: [] as SelectedRule[]
  });

  const profileId = params?.id as string;

  useEffect(() => {
    if (session && profileId) {
      fetchProfile();
      fetchAvailableRules();
    }
  }, [session, profileId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/rules-profiles/${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          isClubDefault: data.isClubDefault,
          rules: data.rules.map((r: RulesProfileRule) => ({
            ruleId: r.ruleId,
            customPoints: r.customPoints,
            isEnabled: r.isEnabled
          }))
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchAvailableRules = async () => {
    try {
      const response = await fetch('/api/rules');
      if (response.ok) {
        const data = await response.json();
        setAvailableRules(data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    const isSelected = formData.rules.some(r => r.ruleId === ruleId);

    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        rules: prev.rules.filter(r => r.ruleId !== ruleId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, { ruleId, customPoints: null, isEnabled: true }]
      }));
    }
  };

  const handleCustomPointsChange = (ruleId: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value);
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map(r =>
        r.ruleId === ruleId
          ? { ...r, customPoints: numValue }
          : r
      )
    }));
  };

  const handleRuleEnabledChange = (ruleId: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map(r =>
        r.ruleId === ruleId
          ? { ...r, isEnabled: enabled }
          : r
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/rules-profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/rules-profiles');
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        </div>
      </MainLayout>
    );
  }

  const selectedRuleIds = new Set(formData.rules.map(r => r.ruleId));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => router.push('/rules-profiles')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Rules Profiles
            </GlassButton>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Rules Profile</h1>
              <p className="text-white/60">{profile.club.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information - Compact */}
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Profile Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter profile name..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="isClubDefault"
                checked={formData.isClubDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isClubDefault: e.target.checked }))}
                className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="isClubDefault" className="text-sm text-white/80">
                Set as club default profile
              </label>
            </div>
          </GlassCard>

          {/* Rules Selection */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Rules Selection</h2>
                <p className="text-white/60 text-sm">
                  {formData.rules.length} of {availableRules.length} rules selected
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {availableRules.map(rule => {
                const isSelected = selectedRuleIds.has(rule.id);
                const selectedRule = formData.rules.find(r => r.ruleId === rule.id);
                const finalPoints = selectedRule?.customPoints ?? rule.pointsAwarded;

                return (
                  <div
                    key={rule.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/20 hover:border-white/30'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Rule Selection Checkbox */}
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRuleToggle(rule.id)}
                          className="mt-1 w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="font-medium text-white">{rule.name}</h3>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-white/10 rounded text-white/70">
                                {rule.category.replace('_', ' ')}
                              </span>
                              <span className="text-white/60">
                                Default: {rule.pointsAwarded} pts
                              </span>
                            </div>
                          </div>
                          {rule.description && (
                            <p className="text-white/60 text-sm mt-1">{rule.description}</p>
                          )}
                          {rule.targetPositions.length > 0 && (
                            <p className="text-white/50 text-xs mt-1">
                              Positions: {rule.targetPositions.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Rule Configuration */}
                      {isSelected && (
                        <div className="flex items-center gap-3 lg:w-auto w-full">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-white/70 whitespace-nowrap">
                              Custom Points:
                            </label>
                            <input
                              type="number"
                              value={selectedRule?.customPoints ?? ''}
                              onChange={(e) => handleCustomPointsChange(rule.id, e.target.value)}
                              className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder={rule.pointsAwarded.toString()}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedRule?.isEnabled ?? true}
                              onChange={(e) => handleRuleEnabledChange(rule.id, e.target.checked)}
                              className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                            />
                            <label className="text-xs text-white/70 whitespace-nowrap">
                              Enabled
                            </label>
                          </div>
                          <div className="text-sm font-medium text-white">
                            = {finalPoints} pts
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Save Button */}
          <div className="flex justify-end">
            <GlassButton
              type="submit"
              disabled={isSaving || !formData.name.trim()}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </GlassButton>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}