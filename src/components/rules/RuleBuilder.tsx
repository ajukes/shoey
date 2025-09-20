'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Eye, Target, Users, User, Settings, Hash, Calculator, Trophy, Crown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';
import {
  FlexibleRule,
  RuleCondition,
  RuleCategory,
  TargetScope,
  ConditionOperator,
  ConditionScope,
  PositionCategory,
  ALL_VARIABLES,
  GAME_VARIABLES,
  PLAYER_VARIABLES,
  OPERATOR_LABELS,
  OPERATOR_SYMBOLS,
  POSITION_VALUES
} from '@/types/rules';
import { RulesEngine } from '@/lib/rules-engine';

interface RuleBuilderProps {
  initialRule?: Partial<FlexibleRule>;
  onSave: (rule: FlexibleRule) => void;
  onCancel: () => void;
  teamId: string;
}

interface CustomVariable {
  id: string;
  key: string;
  label: string;
  description: string;
  scope: string;
  dataType: string;
}

interface VariableDefinition {
  key: string;
  label: string;
  scope: ConditionScope;
  description: string;
  dataType: string;
}

export function RuleBuilder({ initialRule, onSave, onCancel, teamId }: RuleBuilderProps) {
  const [rule, setRule] = useState<Partial<FlexibleRule>>({
    name: '',
    description: '',
    category: RuleCategory.GAME_RESULT,
    pointsAwarded: 0,
    isMultiplier: false,
    targetScope: TargetScope.ALL_PLAYERS,
    targetPositions: [],
    conditions: [],
    isActive: true,
    teamId,
    ...initialRule
  });

  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [loadingVariables, setLoadingVariables] = useState(true);
  // Force recompilation

  useEffect(() => {
    fetchCustomVariables();
  }, []);

  const fetchCustomVariables = async () => {
    try {
      setLoadingVariables(true);
      const response = await fetch('/api/variables');
      if (response.ok) {
        const variables = await response.json();
        setCustomVariables(variables);
      } else {
        console.error('Failed to fetch custom variables');
      }
    } catch (error) {
      console.error('Error fetching custom variables:', error);
    } finally {
      setLoadingVariables(false);
    }
  };

  const addCondition = () => {
    const newCondition: Partial<RuleCondition> = {
      variable: '',
      operator: ConditionOperator.EQUAL,
      value: 0,
      compareVariable: undefined,
      scope: rule.category === RuleCategory.GAME_RESULT ? ConditionScope.GAME : ConditionScope.PLAYER
    };

    setRule(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), newCondition as RuleCondition]
    }));
  };

  const updateCondition = (index: number, updatedCondition: Partial<RuleCondition>) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions?.map((condition, i) => 
        i === index ? { ...condition, ...updatedCondition } : condition
      ) || []
    }));
  };

  const removeCondition = (index: number) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index) || []
    }));
  };

  const togglePosition = (position: PositionCategory) => {
    setRule(prev => {
      const positions = prev.targetPositions || [];
      const newPositions = positions.includes(position)
        ? positions.filter(p => p !== position)
        : [...positions, position];
      
      return { ...prev, targetPositions: newPositions };
    });
  };

  const previewRule = () => {
    if (!rule.name || !rule.conditions?.length) return;

    // Mock context for preview
    const mockContext = {
      gameVariables: { goalsFor: 2, goalsAgainst: 1 },
      playerVariables: [
        { playerId: '1', goalsScored: 1, goalAssists: 1, greenCards: 0, yellowCards: 0, redCards: 0, position: PositionCategory.FORWARD },
        { playerId: '2', goalsScored: 0, goalAssists: 0, greenCards: 0, yellowCards: 1, redCards: 0, position: PositionCategory.DEFENDER },
        { playerId: '3', goalsScored: 0, goalAssists: 0, greenCards: 0, yellowCards: 0, redCards: 0, position: PositionCategory.GOALKEEPER }
      ]
    };

    const results = RulesEngine.previewRule(rule as FlexibleRule, mockContext);
    setPreviewResults(results);
    setShowPreview(true);
  };

  const handleSave = () => {
    if (!rule.name || !rule.conditions?.length) return;
    
    const validation = RulesEngine.validateRule(rule as FlexibleRule);
    if (!validation.isValid) {
      alert('Rule validation failed: ' + validation.errors.join(', '));
      return;
    }

    onSave(rule as FlexibleRule);
  };

  // Convert custom variables to VariableDefinition format
  const customVariableDefs: VariableDefinition[] = customVariables.map(cv => ({
    key: cv.key,
    label: cv.label,
    scope: cv.scope === 'GAME' ? ConditionScope.GAME : ConditionScope.PLAYER,
    description: cv.description,
    dataType: cv.dataType
  }));

  // Combine built-in and custom variables
  const allGameVariables = [...GAME_VARIABLES, ...customVariableDefs.filter(v => v.scope === ConditionScope.GAME)];
  const allPlayerVariables = [...PLAYER_VARIABLES, ...customVariableDefs.filter(v => v.scope === ConditionScope.PLAYER)];

  const availableVariables = rule.category === RuleCategory.GAME_RESULT
    ? allGameVariables
    : [...allGameVariables, ...allPlayerVariables];

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {initialRule?.id ? 'Edit Rule' : 'Create New Rule'}
          </h2>
          <GlassButton variant="glass" size="sm" iconOnly icon={X} onClick={onCancel} />
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <GlassInput
              label="Rule Name"
              value={rule.name}
              onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Clean Sheet Bonus"
            />
            
            <EnhancedGlassDropdown
              label="Category"
              value={rule.category || ''}
              onChange={(value) => setRule(prev => ({ ...prev, category: value as RuleCategory }))}
              options={[
                { 
                  value: RuleCategory.GAME_RESULT, 
                  label: 'Game Result', 
                  description: 'Win/loss based rules',
                  icon: Target,
                  color: 'primary'
                },
                { 
                  value: RuleCategory.PLAYER_PERFORMANCE, 
                  label: 'Player Performance', 
                  description: 'Individual player rules',
                  icon: User,
                  color: 'success'
                },
                { 
                  value: RuleCategory.MANUAL, 
                  label: 'Manual', 
                  description: 'Custom manual rules',
                  icon: Settings,
                  color: 'warning'
                }
              ]}
              modal
            />
          </div>

          <GlassInput
            label="Description"
            value={rule.description}
            onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe when this rule applies..."
          />

          {/* Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Conditions</h3>
              <GlassButton size="sm" icon={Plus} onClick={addCondition}>
                Add Condition
              </GlassButton>
            </div>

            {rule.conditions?.map((condition, index) => {
              return (
                <GlassCard key={index} padding="sm" className="relative">
                  <div className="space-y-4">
                    {/* Variable and Operator Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <EnhancedGlassDropdown
                        label="Variable"
                        value={condition.variable}
                        onChange={(value) => updateCondition(index, { variable: value as string })}
                        options={availableVariables.map(variable => ({
                          value: variable.key,
                          label: variable.label,
                          description: variable.description,
                          icon: Hash,
                          color: variable.scope === ConditionScope.GAME ? 'primary' : 'success'
                        }))}
                        placeholder={loadingVariables ? "Loading variables..." : "Select variable..."}
                        modal
                        size="sm"
                        disabled={loadingVariables}
                      />

                      <EnhancedGlassDropdown
                        label="Operator"
                        value={condition.operator}
                        onChange={(value) => updateCondition(index, { operator: value as ConditionOperator })}
                        options={Object.entries(OPERATOR_LABELS).map(([key, label]) => ({
                          value: key,
                          label: `${OPERATOR_SYMBOLS[key as ConditionOperator]} ${label}`,
                          description: `${label} comparison`,
                          icon: Calculator,
                          color: 'primary'
                        }))}
                        modal
                        size="sm"
                      />
                    </div>

                    {/* Comparison Type Toggle */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white/60">Compare To</label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm rounded ${
                            !condition.compareVariable
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                          onClick={() => updateCondition(index, { compareVariable: undefined })}
                        >
                          Static Value
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm rounded ${
                            condition.compareVariable
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                          onClick={() => updateCondition(index, { compareVariable: '' })}
                        >
                          Another Variable
                        </button>
                      </div>
                    </div>

                    {/* Value or Variable Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                      {(() => {
                        if (condition.compareVariable) {
                          return (
                            <EnhancedGlassDropdown
                              label="Compare Variable"
                              value={condition.compareVariable || ''}
                              onChange={(value) => updateCondition(index, { compareVariable: value as string })}
                              options={availableVariables
                                .filter(variable => variable.scope === (rule.category === RuleCategory.GAME_RESULT ? ConditionScope.GAME : condition.scope))
                                .map(variable => ({
                                  value: variable.key,
                                  label: variable.label,
                                  description: variable.description,
                                  icon: Hash,
                                  color: variable.scope === ConditionScope.GAME ? 'primary' : 'success'
                                }))}
                              placeholder="Select compare variable..."
                              modal
                              size="sm"
                              disabled={loadingVariables}
                            />
                          );
                        } else if (condition.variable === 'position') {
                          return (
                            <EnhancedGlassDropdown
                              label="Position"
                              value={condition.value.toString()}
                              onChange={(value) => updateCondition(index, { value: parseInt(Array.isArray(value) ? value[0] : value) || 1 })}
                              options={Object.entries(POSITION_VALUES).map(([position, value]) => ({
                                value: value.toString(),
                                label: position.toLowerCase().replace('_', ' '),
                                description: `${position.toLowerCase().replace('_', ' ')} position`,
                                icon: User,
                                color: 'success'
                              }))}
                              modal
                              size="sm"
                            />
                          );
                        } else {
                          return (
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-white/60">Value</label>
                              <input
                                type="number"
                                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
                                value={condition.value}
                                onChange={(e) => updateCondition(index, { value: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          );
                        }
                      })()}

                      <div className="flex justify-end">
                        <GlassButton
                          variant="danger"
                          size="sm"
                          iconOnly
                          icon={X}
                          onClick={() => removeCondition(index)}
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Points & Targeting */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Points</h3>
              
              <div className="flex items-center space-x-4">
                <GlassInput
                  label="Points Awarded"
                  type="number"
                  value={rule.pointsAwarded?.toString()}
                  onChange={(e) => setRule(prev => ({ ...prev, pointsAwarded: parseInt(e.target.value) || 0 }))}
                />
                
                <label className="flex items-center space-x-2 text-white/80">
                  <input
                    type="checkbox"
                    checked={rule.isMultiplier}
                    onChange={(e) => setRule(prev => ({ ...prev, isMultiplier: e.target.checked }))}
                    className="rounded border-white/20"
                  />
                  <span className="text-sm">Multiplier</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Apply To</h3>
              
              <EnhancedGlassDropdown
                label="Target Scope"
                value={rule.targetScope || ''}
                onChange={(value) => setRule(prev => ({ ...prev, targetScope: value as TargetScope }))}
                options={[
                  { 
                    value: TargetScope.ALL_PLAYERS, 
                    label: 'All Players', 
                    description: 'Apply to every player',
                    icon: Users,
                    color: 'success'
                  },
                  { 
                    value: TargetScope.BY_POSITION, 
                    label: 'By Position', 
                    description: 'Apply to specific positions',
                    icon: Target,
                    color: 'primary'
                  },
                  { 
                    value: TargetScope.INDIVIDUAL_PLAYER, 
                    label: 'Individual Player', 
                    description: 'Apply to specific player',
                    icon: User,
                    color: 'warning'
                  }
                ]}
                modal
              />

              {rule.targetScope === TargetScope.BY_POSITION && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Positions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(PositionCategory).map(position => (
                      <label key={position} className="flex items-center space-x-2 text-white/80">
                        <input
                          type="checkbox"
                          checked={rule.targetPositions?.includes(position) || false}
                          onChange={() => togglePosition(position)}
                          className="rounded border-white/20"
                        />
                        <span className="text-sm capitalize">{position.toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <GlassButton variant="glass" icon={Eye} onClick={previewRule}>
              Preview Rule
            </GlassButton>
            
            <div className="space-x-3">
              <GlassButton variant="glass" onClick={onCancel}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" onClick={handleSave}>
                Save Rule
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Preview Results */}
      {showPreview && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Preview Results</h3>
            <GlassButton size="sm" iconOnly icon={X} onClick={() => setShowPreview(false)} />
          </div>
          
          <div className="space-y-2">
            {previewResults.length > 0 ? (
              previewResults.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-white/80">Player {result.playerId}</span>
                  <span className={`font-bold ${result.pointsAwarded >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.pointsAwarded >= 0 ? '+' : ''}{result.pointsAwarded} points
                  </span>
                </div>
              ))
            ) : (
              <p className="text-white/60 text-center py-4">No players would be affected by this rule</p>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}