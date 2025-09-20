'use client';

import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';

interface Rule {
  id: string;
  name: string;
  description?: string;
  category: string;
  pointsAwarded: number;
  isMultiplier: boolean;
  targetScope: string;
  targetPositions: string[];
  isActive: boolean;
}

interface EditRulesProfileModalProps {
  profile: {
    id: string;
    name: string;
    description?: string;
    isClubDefault: boolean;
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
  };
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function EditRulesProfileModal({ profile, onClose, onSubmit }: EditRulesProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [allRules, setAllRules] = useState<Rule[]>([]);
  const [formData, setFormData] = useState({
    name: profile.name,
    description: profile.description || '',
    isClubDefault: profile.isClubDefault,
    rules: profile.rules.map(r => ({
      ruleId: r.ruleId,
      customPoints: r.customPoints,
      isEnabled: r.isEnabled
    }))
  });

  useEffect(() => {
    fetchAllRules();
  }, []);

  const fetchAllRules = async () => {
    try {
      const response = await fetch('/api/rules');
      if (response.ok) {
        const data = await response.json();
        setAllRules(data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    const rule = allRules.find(r => r.id === ruleId);
    if (!rule) return;

    const existingRuleIndex = formData.rules.findIndex(r => r.ruleId === ruleId);

    if (existingRuleIndex >= 0) {
      // Remove rule
      setFormData(prev => ({
        ...prev,
        rules: prev.rules.filter(r => r.ruleId !== ruleId)
      }));
    } else {
      // Add rule
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, {
          ruleId,
          customPoints: null,
          isEnabled: true
        }]
      }));
    }
  };

  const handleCustomPointsChange = (ruleId: string, points: number | null) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map(r =>
        r.ruleId === ruleId ? { ...r, customPoints: points } : r
      )
    }));
  };

  const handleRuleEnabledChange = (ruleId: string, isEnabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map(r =>
        r.ruleId === ruleId ? { ...r, isEnabled } : r
      )
    }));
  };

  const selectedRuleIds = new Set(formData.rules.map(r => r.ruleId));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Edit Rules Profile</h2>
            <p className="text-sm text-white/60">{profile.club.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Profile Name *
                </label>
                <GlassInput
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Super Competition Rules"
                  required
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isClubDefault"
                    checked={formData.isClubDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isClubDefault: e.target.checked }))}
                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isClubDefault" className="text-sm text-white/80 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Club default profile
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of this profile"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                rows={3}
              />
            </div>

            {/* Rules Selection */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">
                Select Rules ({formData.rules.length} selected, {formData.rules.filter(r => r.isEnabled).length} enabled)
              </label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allRules.map(rule => {
                  const isSelected = selectedRuleIds.has(rule.id);
                  const selectedRule = formData.rules.find(r => r.ruleId === rule.id);

                  return (
                    <div
                      key={rule.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected
                          ? selectedRule?.isEnabled
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-orange-500/50 bg-orange-500/10'
                          : 'border-white/20 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRuleToggle(rule.id)}
                          className="mt-1 w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-white">{rule.name}</h4>
                              {rule.description && (
                                <p className="text-sm text-white/60 mt-1">{rule.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/70">
                                  {rule.category}
                                </span>
                                <span className="text-xs text-white/50">
                                  Default: {rule.pointsAwarded} pts
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="ml-4 flex items-center gap-3">
                                <div>
                                  <label className="block text-xs text-white/70 mb-1">
                                    Enabled
                                  </label>
                                  <input
                                    type="checkbox"
                                    checked={selectedRule?.isEnabled !== false}
                                    onChange={(e) => handleRuleEnabledChange(rule.id, e.target.checked)}
                                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-white/70 mb-1">
                                    Custom Points
                                  </label>
                                  <input
                                    type="number"
                                    value={selectedRule?.customPoints || ''}
                                    onChange={(e) => handleCustomPointsChange(
                                      rule.id,
                                      e.target.value ? parseInt(e.target.value) : null
                                    )}
                                    placeholder={rule.pointsAwarded.toString()}
                                    className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
          <GlassButton
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </GlassButton>
          <GlassButton
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}