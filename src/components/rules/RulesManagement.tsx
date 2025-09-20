'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTable } from '@/components/ui/GlassTable';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';
import { Target, Users, User, Settings } from 'lucide-react';
import { RuleBuilder } from './RuleBuilder';
import {
  FlexibleRule,
  RuleCategory,
  TargetScope,
  OPERATOR_SYMBOLS
} from '@/types/rules';

interface RulesManagementProps {
  teamId: string;
}


export function RulesManagement({ teamId }: RulesManagementProps) {
  const [rules, setRules] = useState<FlexibleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<FlexibleRule | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RuleCategory | 'ALL'>('ALL');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        setError('Failed to fetch rules');
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      setError('Error loading rules');
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = selectedCategory === 'ALL' 
    ? rules 
    : rules.filter(rule => rule.category === selectedCategory);

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowBuilder(true);
  };

  const handleEditRule = (rule: FlexibleRule) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const handleSaveRule = async (rule: FlexibleRule) => {
    try {
      if (editingRule) {
        // Update existing rule
        const response = await fetch(`/api/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rule)
        });
        if (response.ok) {
          await fetchRules();
        }
      } else {
        // Create new rule
        const response = await fetch('/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rule)
        });
        if (response.ok) {
          await fetchRules();
        }
      }
      setShowBuilder(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      try {
        const response = await fetch(`/api/rules/${ruleId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchRules();
        }
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  const handleToggleActive = async (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (rule) {
        const response = await fetch(`/api/rules/${ruleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rule, isActive: !rule.isActive })
        });
        if (response.ok) {
          await fetchRules();
        }
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const formatConditions = (conditions: any[]) => {
    return conditions.map(condition => 
      `${condition.variable} ${OPERATOR_SYMBOLS[condition.operator]} ${condition.value}`
    ).join(' AND ');
  };

  const formatTargetScope = (rule: FlexibleRule) => {
    switch (rule.targetScope) {
      case TargetScope.ALL_PLAYERS:
        return 'All Players';
      case TargetScope.BY_POSITION:
        return rule.targetPositions.map(pos => pos.toLowerCase()).join(', ');
      case TargetScope.INDIVIDUAL_PLAYER:
        return 'Individual';
      default:
        return 'Unknown';
    }
  };

  const getCategoryColor = (category: RuleCategory) => {
    switch (category) {
      case RuleCategory.GAME_RESULT:
        return 'text-blue-400 bg-blue-400/20';
      case RuleCategory.PLAYER_PERFORMANCE:
        return 'text-green-400 bg-green-400/20';
      case RuleCategory.MANUAL:
        return 'text-purple-400 bg-purple-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const columns = [
    {
      key: 'name' as keyof FlexibleRule,
      header: 'Rule Name',
      render: (value: any, rule: FlexibleRule) => (
        <div>
          <div className="font-medium text-white">{rule.name}</div>
          <div className="text-xs text-white/60">{rule.description}</div>
        </div>
      )
    },
    {
      key: 'category' as keyof FlexibleRule,
      header: 'Category',
      render: (value: any, rule: FlexibleRule) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(rule.category)}`}>
          {rule.category.replace('_', ' ')}
        </span>
      ),
      mobileHidden: true
    },
    {
      key: 'pointsAwarded' as keyof FlexibleRule,
      header: 'Points',
      render: (value: any, rule: FlexibleRule) => (
        <span className={`font-bold ${rule.pointsAwarded >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {rule.pointsAwarded >= 0 ? '+' : ''}{rule.pointsAwarded}
          {rule.isMultiplier && <span className="text-xs ml-1">×</span>}
        </span>
      )
    },
    {
      key: 'targetScope' as keyof FlexibleRule,
      header: 'Applies To',
      render: (value: any, rule: FlexibleRule) => (
        <div className="text-sm text-white/80">
          {formatTargetScope(rule)}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'isActive' as keyof FlexibleRule,
      header: 'Status',
      render: (value: any, rule: FlexibleRule) => (
        <button
          onClick={() => handleToggleActive(rule.id!)}
          className="flex items-center space-x-2"
        >
          {rule.isActive ? (
            <ToggleRight className="text-green-400" size={20} />
          ) : (
            <ToggleLeft className="text-gray-400" size={20} />
          )}
          <span className={`text-xs ${rule.isActive ? 'text-green-400' : 'text-gray-400'}`}>
            {rule.isActive ? 'Active' : 'Inactive'}
          </span>
        </button>
      )
    },
    {
      key: 'actions' as keyof FlexibleRule,
      header: 'Actions',
      render: (value: any, rule: FlexibleRule) => (
        <div className="flex space-x-2">
          <GlassButton
            size="xs"
            iconOnly
            icon={Edit}
            onClick={() => handleEditRule(rule)}
          />
          <GlassButton
            size="xs"
            variant="danger"
            iconOnly
            icon={Trash2}
            onClick={() => handleDeleteRule(rule.id!)}
          />
        </div>
      )
    }
  ];

  if (showBuilder) {
    return (
      <RuleBuilder
        initialRule={editingRule || undefined}
        onSave={handleSaveRule}
        onCancel={() => {
          setShowBuilder(false);
          setEditingRule(null);
        }}
        teamId={teamId}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-white/70">Loading rules...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6 text-center">
          <div className="text-red-400 mb-4">Error loading rules</div>
          <p className="text-white/70 mb-4">{error}</p>
          <GlassButton onClick={fetchRules}>Try Again</GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Rules</h1>
          <p className="text-white/60">Manage scoring rules for your team</p>
        </div>
        <GlassButton variant="primary" icon={Plus} onClick={handleCreateRule}>
          Create Rule
        </GlassButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-blue-400">{rules.filter(r => r.category === RuleCategory.GAME_RESULT).length}</div>
          <div className="text-xs text-white/60">Game Rules</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-400">{rules.filter(r => r.category === RuleCategory.PLAYER_PERFORMANCE).length}</div>
          <div className="text-xs text-white/60">Player Rules</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-purple-400">{rules.filter(r => r.category === RuleCategory.MANUAL).length}</div>
          <div className="text-xs text-white/60">Manual Rules</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{rules.filter(r => r.isActive).length}</div>
          <div className="text-xs text-white/60">Active Rules</div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard padding="sm">
        <div className="flex items-center space-x-4">
          <EnhancedGlassDropdown
            label="Filter by Category"
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value as RuleCategory | 'ALL')}
            options={[
              { value: 'ALL', label: 'All Categories', description: 'Show all rule types', icon: Settings },
              { value: RuleCategory.GAME_RESULT, label: 'Game Result', description: 'Win/loss based rules', icon: Target, color: 'primary' },
              { value: RuleCategory.PLAYER_PERFORMANCE, label: 'Player Performance', description: 'Individual player rules', icon: User, color: 'success' },
              { value: RuleCategory.MANUAL, label: 'Manual', description: 'Custom manual rules', icon: Users, color: 'warning' }
            ]}
            modal
            size="sm"
            variant="minimal"
            className="min-w-[200px]"
          />
        </div>
      </GlassCard>

      {/* Rules Table */}
      <GlassTable
        data={filteredRules}
        columns={columns}
        mobileCardView={true}
      />

      {/* Sample Rules Section */}
      <GlassCard>
        <h3 className="text-lg font-medium text-white mb-4">Quick Start Templates</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-blue-400">Game Rules</h4>
            <div className="space-y-2 text-sm">
              <div className="text-white/80">• Win Bonus: +5 points to all players</div>
              <div className="text-white/80">• Clean Sheet (GK): +4 points to goalkeeper</div>
              <div className="text-white/80">• Clean Sheet (DEF): +2 points to defenders</div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-green-400">Player Rules</h4>
            <div className="space-y-2 text-sm">
              <div className="text-white/80">• Goal Scored: +10 points per goal</div>
              <div className="text-white/80">• Assist: +5 points per assist</div>
              <div className="text-white/80">• Yellow Card: -5 points per card</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}