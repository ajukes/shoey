'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, ChevronLeft, ChevronRight, Users, Plus, Minus, TrendingDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';

interface Rule {
  id: string;
  name: string;
  description?: string;
  pointsAwarded: number;
  category: string;
  targetScope: string;
  conditions?: any[];
  isCustomPoints?: boolean;
}

interface Player {
  id: string;
  fullName: string;
  nickname?: string;
  playingPosition?: {
    name: string;
    category: string;
  };
}

interface GamePlayer {
  player: Player;
}

interface Game {
  id: string;
  goalsFor?: number;
  goalsAgainst?: number;
  opponent?: string;
  team: {
    id: string;
    name: string;
  };
  gamePlayers?: GamePlayer[];
}

interface RuleAssignment {
  ruleId: string;
  playerId: string;
  count: number;
  points: number;
}

interface GameCompletionModalProps {
  game: Game;
  onComplete: (completedGame: any) => void;
  onCancel: () => void;
}

export function GameCompletionModal({ game, onComplete, onCancel }: GameCompletionModalProps) {
  const [step, setStep] = useState<'score' | 'rules' | 'summary'>('score');
  const [goalsFor, setGoalsFor] = useState(game.goalsFor || 0);
  const [goalsAgainst, setGoalsAgainst] = useState(game.goalsAgainst || 0);
  const [loading, setLoading] = useState(false);
  const [gameData, setGameData] = useState(game);
  const [fetchingGameData, setFetchingGameData] = useState(false);

  // Rules and assignments
  const [rules, setRules] = useState<Rule[]>([]);
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const [ruleAssignments, setRuleAssignments] = useState<RuleAssignment[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // Fetch complete game data if gamePlayers is missing
  useEffect(() => {
    async function fetchGameData() {
      if (!game.gamePlayers && !fetchingGameData) {
        setFetchingGameData(true);
        try {
          const response = await fetch(`/api/games/${game.id}`);
          if (response.ok) {
            const completeGame = await response.json();
            setGameData(completeGame);
          }
        } catch (error) {
          console.error('Error fetching game data:', error);
        } finally {
          setFetchingGameData(false);
        }
      }
    }
    fetchGameData();
  }, [game.id, game.gamePlayers]);

  // Fetch rules based on team's rules profile when moving to rules step
  // Load existing rule assignments if game is already completed
  useEffect(() => {
    if (game.status === 'COMPLETED') {
      loadExistingRuleAssignments();
    }
  }, [game.id, game.status]);

  const loadExistingRuleAssignments = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}/rule-points`);
      if (response.ok) {
        const existingPoints = await response.json();

        // Merge TEAM and CLUB rule points by taking MAX count for each rule
        // This allows unified editing while preserving both point types on save
        const mergedAssignments = new Map<string, RuleAssignment>();

        existingPoints.forEach((point: any) => {
          const key = `${point.playerId}-${point.ruleId}`;
          const existing = mergedAssignments.get(key);

          // Extract count from notes (format: "Manual assignment: X instances")
          const countMatch = point.notes?.match(/(\d+) instances/);
          const count = countMatch ? parseInt(countMatch[1]) : 1;
          const pointsPerInstance = point.points / count;

          if (existing) {
            // Take MAX count between TEAM and CLUB versions
            if (count > existing.count) {
              existing.count = count;
              existing.points = count * pointsPerInstance;
            }
          } else {
            mergedAssignments.set(key, {
              ruleId: point.ruleId,
              playerId: point.playerId,
              count,
              points: point.points
            });
          }
        });

        const assignments = Array.from(mergedAssignments.values());

        setRuleAssignments(assignments);
        console.log('Loaded existing rule assignments:', assignments);
      }
    } catch (error) {
      console.error('Error loading existing rule assignments:', error);
    }
  };

  useEffect(() => {
    async function fetchRules() {
      if (step === 'rules' && rules.length === 0 && !loadingRules && gameData.team) {
        setLoadingRules(true);
        try {
          // Fetch rules based on the team's rules profile
          const response = await fetch(`/api/teams/${gameData.team.id}/rules`);
          if (response.ok) {
            const rulesData = await response.json();
            setRules(rulesData);
          } else {
            // Fallback to global rules if team-specific rules fail
            const fallbackResponse = await fetch('/api/rules');
            if (fallbackResponse.ok) {
              const rulesData = await fallbackResponse.json();
              setRules(rulesData);
            }
          }
        } catch (error) {
          console.error('Error fetching rules:', error);
          // Fallback to global rules on error
          try {
            const fallbackResponse = await fetch('/api/rules');
            if (fallbackResponse.ok) {
              const rulesData = await fallbackResponse.json();
              setRules(rulesData);
            }
          } catch (fallbackError) {
            console.error('Error fetching fallback rules:', fallbackError);
          }
        } finally {
          setLoadingRules(false);
        }
      }
    }
    fetchRules();
  }, [step, rules.length, gameData.team?.id]);

  const currentRule = rules[currentRuleIndex];
  const players = gameData.gamePlayers || [];

  const updatePlayerRuleCount = (playerId: string, delta: number) => {
    if (!currentRule) return;

    setRuleAssignments(prev => {
      const existing = prev.find(a => a.ruleId === currentRule.id && a.playerId === playerId);

      if (existing) {
        const newCount = Math.max(0, existing.count + delta);
        if (newCount === 0) {
          return prev.filter(a => !(a.ruleId === currentRule.id && a.playerId === playerId));
        }
        return prev.map(a =>
          a.ruleId === currentRule.id && a.playerId === playerId
            ? { ...a, count: newCount, points: newCount * currentRule.pointsAwarded }
            : a
        );
      } else if (delta > 0) {
        return [...prev, {
          ruleId: currentRule.id,
          playerId,
          count: 1,
          points: currentRule.pointsAwarded
        }];
      }
      return prev;
    });
  };

  const getPlayerRuleCount = (playerId: string) => {
    if (!currentRule) return 0;
    const assignment = ruleAssignments.find(a => a.ruleId === currentRule.id && a.playerId === playerId);
    return assignment?.count || 0;
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Convert rule assignments to player stats format expected by API
      const playerStats = players.map(gamePlayer => {
        const playerId = gamePlayer.player.id;
        const playerAssignments = ruleAssignments.filter(a => a.playerId === playerId);

        return {
          playerId,
          goalsScored: 0,
          goalAssists: 0,
          greenCards: 0,
          yellowCards: 0,
          redCards: 0,
          saves: 0,
          tackles: 0,
          passes: 0,
          played: true,
          ruleAssignments: playerAssignments
        };
      });

      const response = await fetch(`/api/games/${game.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalsFor,
          goalsAgainst,
          status: 'COMPLETED',
          playerStats
        }),
      });

      if (response.ok) {
        const completedGame = await response.json();
        onComplete(completedGame);
      } else {
        const error = await response.json();
        alert(`Error completing game: ${error.error}`);
      }
    } catch (error) {
      console.error('Error completing game:', error);
      alert('Failed to complete game');
    } finally {
      setLoading(false);
    }
  };

  const nextRule = () => {
    if (currentRuleIndex < rules.length - 1) {
      setCurrentRuleIndex(currentRuleIndex + 1);
    } else {
      setStep('summary');
    }
  };

  const prevRule = () => {
    if (currentRuleIndex > 0) {
      setCurrentRuleIndex(currentRuleIndex - 1);
    } else {
      setStep('score');
    }
  };

  const getTotalPoints = () => {
    return ruleAssignments.reduce((sum, assignment) => sum + assignment.points, 0);
  };

  const getPlayerTotalPoints = (playerId: string) => {
    return ruleAssignments
      .filter(a => a.playerId === playerId)
      .reduce((sum, assignment) => sum + assignment.points, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] overflow-y-auto">
        {fetchingGameData ? (
          <div className="text-center py-12">
            <div className="text-white/60 mb-2">Loading game data...</div>
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {game.status === 'COMPLETED' ? 'Re-complete Game' : 'Complete Game'}
                </h2>
                <p className="text-white/60">
                  vs {game.opponent}
                  {game.status === 'COMPLETED' && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400">
                      EDITING
                    </span>
                  )}
                </p>
              </div>
              <GlassButton
                variant="glass"
                size="sm"
                iconOnly
                icon={X}
                onClick={onCancel}
              />
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${step === 'score' ? 'bg-blue-400' : 'bg-white/20'}`} />
                <div className="w-8 h-px bg-white/20" />
                <div className={`w-3 h-3 rounded-full ${step === 'rules' ? 'bg-blue-400' : 'bg-white/20'}`} />
                <div className="w-8 h-px bg-white/20" />
                <div className={`w-3 h-3 rounded-full ${step === 'summary' ? 'bg-blue-400' : 'bg-white/20'}`} />
              </div>
            </div>

            {/* Score Step */}
            {step === 'score' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white text-center mb-6">
                  Enter Final Score
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Our Team */}
                  <div className="text-center">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-white mb-2">{game.team.name}</h4>
                      <p className="text-xs text-green-400 font-medium">HOME</p>
                    </div>

                    <div className="flex items-center justify-center gap-4 mb-4">
                      <GlassButton
                        variant="danger"
                        size="lg"
                        iconOnly
                        icon={Minus}
                        onClick={() => setGoalsFor(Math.max(0, goalsFor - 1))}
                        disabled={goalsFor <= 0}
                      />
                      <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                        <span className="text-3xl font-bold text-white">{goalsFor}</span>
                      </div>
                      <GlassButton
                        variant="success"
                        size="lg"
                        iconOnly
                        icon={Plus}
                        onClick={() => setGoalsFor(goalsFor + 1)}
                      />
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-2">
                        <span className="text-xl font-bold text-white/60">VS</span>
                      </div>
                      <p className="text-sm text-white/40">Final</p>
                    </div>
                  </div>

                  {/* Opponent */}
                  <div className="text-center">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-white mb-2">{game.opponent || 'Opponent'}</h4>
                      <p className="text-xs text-orange-400 font-medium">AWAY</p>
                    </div>

                    <div className="flex items-center justify-center gap-4 mb-4">
                      <GlassButton
                        variant="danger"
                        size="lg"
                        iconOnly
                        icon={Minus}
                        onClick={() => setGoalsAgainst(Math.max(0, goalsAgainst - 1))}
                        disabled={goalsAgainst <= 0}
                      />
                      <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                        <span className="text-3xl font-bold text-white">{goalsAgainst}</span>
                      </div>
                      <GlassButton
                        variant="success"
                        size="lg"
                        iconOnly
                        icon={Plus}
                        onClick={() => setGoalsAgainst(goalsAgainst + 1)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <GlassButton
                    variant="primary"
                    onClick={() => setStep('rules')}
                    icon={ChevronRight}
                  >
                    Next: Assign Rule Points
                  </GlassButton>
                </div>
              </div>
            )}

            {/* Rules Step */}
            {step === 'rules' && (
              <div className="space-y-6">
                {loadingRules ? (
                  <div className="text-center py-8">
                    <div className="text-white/60 mb-2">Loading rules...</div>
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : currentRule ? (
                  <>
                    {/* Rule Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-white mb-2">
                        {currentRule.name}
                      </h3>
                      {currentRule.description && (
                        <p className="text-white/60 text-sm mb-3">{currentRule.description}</p>
                      )}
                      <div className="flex items-center justify-center gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/20 text-green-400 text-sm">
                          <Trophy size={14} />
                          {currentRule.pointsAwarded} points each
                          {currentRule.isCustomPoints && (
                            <span className="text-xs text-yellow-400 ml-1">(Custom)</span>
                          )}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          currentRule.category === 'GAME_RESULT'
                            ? 'bg-blue-400/20 text-blue-400'
                            : currentRule.category === 'PLAYER_PERFORMANCE'
                            ? 'bg-purple-400/20 text-purple-400'
                            : 'bg-gray-400/20 text-gray-400'
                        }`}>
                          {currentRule.category.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-white/40">
                        Rule {currentRuleIndex + 1} of {rules.length}
                      </div>
                    </div>

                    {/* Players Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {players.map((gamePlayer) => {
                        const player = gamePlayer.player;
                        const count = getPlayerRuleCount(player.id);

                        return (
                          <GlassCard key={player.id} padding="sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white">
                                  {player.nickname || player.fullName}
                                </div>
                                {player.playingPosition && (
                                  <div className="text-xs text-white/60">
                                    {player.playingPosition.name}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <GlassButton
                                  variant="danger"
                                  size="sm"
                                  iconOnly
                                  icon={Minus}
                                  onClick={() => updatePlayerRuleCount(player.id, -1)}
                                  disabled={count <= 0}
                                />

                                <div className="w-12 h-8 flex items-center justify-center rounded bg-white/10 border border-white/20">
                                  <span className="text-white font-medium">{count}</span>
                                </div>

                                <GlassButton
                                  variant="success"
                                  size="sm"
                                  iconOnly
                                  icon={Plus}
                                  onClick={() => updatePlayerRuleCount(player.id, 1)}
                                />
                              </div>
                            </div>
                          </GlassCard>
                        );
                      })}
                    </div>

                    {/* Rule Navigation */}
                    <div className="flex justify-between items-center pt-6">
                      <GlassButton
                        variant="glass"
                        onClick={prevRule}
                        icon={ChevronLeft}
                      >
                        {currentRuleIndex === 0 ? 'Back to Score' : 'Previous Rule'}
                      </GlassButton>

                      <div className="text-center">
                        <div className="text-sm text-white/60">
                          Current rule total: {ruleAssignments
                            .filter(a => a.ruleId === currentRule.id)
                            .reduce((sum, a) => sum + a.points, 0)} points
                        </div>
                      </div>

                      <GlassButton
                        variant="primary"
                        onClick={nextRule}
                        icon={currentRuleIndex === rules.length - 1 ? Trophy : ChevronRight}
                      >
                        {currentRuleIndex === rules.length - 1 ? 'Finish' : 'Next Rule'}
                      </GlassButton>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-white/60">No rules found. Proceeding to summary...</div>
                    <GlassButton
                      variant="primary"
                      onClick={() => setStep('summary')}
                      className="mt-4"
                    >
                      Continue to Summary
                    </GlassButton>
                  </div>
                )}
              </div>
            )}

            {/* Summary Step */}
            {step === 'summary' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white text-center mb-4">
                  Game Summary
                </h3>

                {/* Score Summary - Compact */}
                <GlassCard padding="xs">
                  <div className="text-center py-2">
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                      {goalsFor} - {goalsAgainst}
                    </div>
                    <div className="text-sm text-white/60 truncate px-2">
                      {game.team.name} vs {game.opponent || 'TBD'}
                    </div>
                  </div>
                </GlassCard>

                {/* Player Points Summary - Responsive Grid */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Users size={16} />
                    Player Points ({players.filter(gp => getPlayerTotalPoints(gp.player.id) !== 0).length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      // Calculate highest and lowest points to show trophy and spoon
                      const playersWithPoints = players.map(gp => ({
                        ...gp,
                        totalPoints: getPlayerTotalPoints(gp.player.id)
                      })).filter(p => p.totalPoints !== 0);

                      const maxPoints = Math.max(...playersWithPoints.map(p => p.totalPoints));
                      const minPoints = Math.min(...playersWithPoints.map(p => p.totalPoints));

                      // Only show spoon if there are multiple players and the min is different from max
                      const showSpoon = playersWithPoints.length > 1 && minPoints !== maxPoints;

                      return playersWithPoints.map((gamePlayerWithPoints) => {
                        const gamePlayer = gamePlayerWithPoints;
                        const player = gamePlayer.player;
                        const totalPoints = gamePlayerWithPoints.totalPoints;
                        const playerAssignments = ruleAssignments.filter(a => a.playerId === player.id);
                        const isTopPlayer = totalPoints === maxPoints && totalPoints > 0;
                        const isBottomPlayer = showSpoon && totalPoints === minPoints;

                        return (
                          <GlassCard key={player.id} padding="sm" className="min-h-0">
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-white text-sm truncate flex items-center gap-2">
                                  {player.nickname || player.fullName}
                                  {isTopPlayer && <Trophy size={14} className="text-yellow-400 flex-shrink-0" />}
                                  {isBottomPlayer && <TrendingDown size={14} className="text-orange-400 flex-shrink-0" />}
                                </div>
                                <div className="text-xs space-y-1 mt-2">
                                  {playerAssignments.map((assignment) => {
                                    const rule = rules.find(r => r.id === assignment.ruleId);
                                    const isNegative = assignment.points < 0;
                                    return (
                                      <div key={assignment.ruleId} className={`truncate ${isNegative ? 'text-red-400' : 'text-white/60'}`}>
                                        {rule?.name}: {assignment.count} × {rule?.pointsAwarded} = {assignment.points}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className={`text-lg font-bold flex-shrink-0 ${totalPoints < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {totalPoints}
                              </div>
                            </div>
                          </GlassCard>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Total - Compact */}
                <GlassCard padding="sm" className={`${getTotalPoints() < 0 ? 'bg-red-400/10 border-red-400/30' : 'bg-green-400/10 border-green-400/30'}`}>
                  <div className="flex justify-between items-center">
                    <div className="text-white font-medium text-sm">Total Points Awarded</div>
                    <div className={`text-xl font-bold ${getTotalPoints() < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {getTotalPoints()}
                    </div>
                  </div>
                </GlassCard>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6">
                  <GlassButton
                    variant="glass"
                    onClick={() => setStep('rules')}
                    icon={ChevronLeft}
                  >
                    Back to Rules
                  </GlassButton>

                  <GlassButton
                    variant="success"
                    onClick={handleComplete}
                    loading={loading}
                    icon={Trophy}
                  >
                    {loading
                      ? 'Updating...'
                      : game.status === 'COMPLETED'
                        ? 'Update Game'
                        : 'Complete Game'
                    }
                  </GlassButton>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}