'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, Shield, Plus, Minus } from 'lucide-react';
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

interface Club {
  id: string;
  name: string;
}

interface CreateRulesProfileModalProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function CreateRulesProfileModal({ onClose, onSubmit }: CreateRulesProfileModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clubId: '',
    isClubDefault: false,
    rules: [] as Array<{
      ruleId: string;
      customPoints: number | null;
      isEnabled: boolean;
    }>
  });

  useEffect(() => {
    fetchRules();
    fetchClubs();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      if (response.ok) {
        const data = await response.json();
        setClubs(data);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.clubId) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
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
          customPoints: null, // Will use rule's default points
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

  const selectedRuleIds = new Set(formData.rules.map(r => r.ruleId));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Create Rules Profile</h2>
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
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Club *
                </label>
                <select
                  value={formData.clubId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clubId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="">Select a club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id} className="bg-gray-800">
                      {club.name}
                    </option>
                  ))}
                </select>
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

            {/* Club Default Toggle */}
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
                Set as club default profile
              </label>
            </div>

            {/* Rules Selection */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">
                Select Rules ({formData.rules.length} selected)
              </label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rules.map(rule => {
                  const isSelected = selectedRuleIds.has(rule.id);
                  const selectedRule = formData.rules.find(r => r.ruleId === rule.id);

                  return (
                    <div
                      key={rule.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-blue-500/50 bg-blue-500/10'
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
                              <div className="ml-4">
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
            disabled={loading || !formData.name.trim() || !formData.clubId}
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}