import {
  FlexibleRule,
  RuleCondition,
  RuleEvaluationContext,
  RuleEvaluationResult,
  PlayerRuleResult,
  PlayerVariables,
  GameVariables,
  ConditionOperator,
  ConditionScope,
  TargetScope,
  RuleCategory,
  PositionCategory,
  OPERATOR_SYMBOLS,
  POSITION_VALUES,
  VALUE_TO_POSITION
} from '@/types/rules';

/**
 * Core Rules Engine - Evaluates flexible rules against game and player data
 */
export class RulesEngine {
  /**
   * Evaluate all rules for a game and return point assignments
   */
  static evaluateRules(
    rules: FlexibleRule[],
    context: RuleEvaluationContext
  ): RuleEvaluationResult {
    const playerResults: PlayerRuleResult[] = [];

    // Filter active rules only
    const activeRules = rules.filter(rule => rule.isActive);

    for (const rule of activeRules) {
      const ruleResults = this.evaluateRule(rule, context);
      playerResults.push(...ruleResults);
    }

    const totalPointsAwarded = playerResults.reduce(
      (sum, result) => sum + result.pointsAwarded,
      0
    );

    return {
      gameId: '', // Will be set by caller
      playerResults,
      totalPointsAwarded
    };
  }

  /**
   * Evaluate a single rule against the game context
   */
  private static evaluateRule(
    rule: FlexibleRule,
    context: RuleEvaluationContext
  ): PlayerRuleResult[] {
    const results: PlayerRuleResult[] = [];

    if (rule.category === RuleCategory.GAME_RESULT) {
      return this.evaluateGameRule(rule, context);
    } else if (rule.category === RuleCategory.PLAYER_PERFORMANCE) {
      return this.evaluatePlayerRule(rule, context);
    } else if (rule.category === RuleCategory.MANUAL) {
      // Manual rules are applied separately by captains
      return [];
    }

    return results;
  }

  /**
   * Evaluate game-level rules (win/loss/clean sheet)
   */
  private static evaluateGameRule(
    rule: FlexibleRule,
    context: RuleEvaluationContext
  ): PlayerRuleResult[] {
    const results: PlayerRuleResult[] = [];

    // Check if all game conditions are met
    const conditionsMet = rule.conditions.every(condition => {
      if (condition.scope === ConditionScope.GAME) {
        return this.evaluateCondition(condition, context.gameVariables, null);
      }
      return false;
    });

    if (!conditionsMet) {
      return results;
    }

    // Apply points to target players
    const targetPlayers = this.getTargetPlayers(rule, context.playerVariables);
    
    for (const player of targetPlayers) {
      results.push({
        playerId: player.playerId,
        ruleId: rule.id!,
        ruleName: rule.name,
        pointsAwarded: rule.pointsAwarded,
        reason: this.generateRuleReason(rule, context.gameVariables, player)
      });
    }

    return results;
  }

  /**
   * Evaluate player-level rules (goals, assists, cards)
   */
  private static evaluatePlayerRule(
    rule: FlexibleRule,
    context: RuleEvaluationContext
  ): PlayerRuleResult[] {
    const results: PlayerRuleResult[] = [];

    for (const player of context.playerVariables) {
      // Check if all conditions are met for this player
      const conditionsMet = rule.conditions.every(condition => {
        if (condition.scope === ConditionScope.PLAYER) {
          return this.evaluateCondition(condition, context.gameVariables, player);
        } else if (condition.scope === ConditionScope.GAME) {
          return this.evaluateCondition(condition, context.gameVariables, null);
        }
        return false;
      });

      if (!conditionsMet) {
        continue;
      }

      // Check if this player is a target for the rule
      const targetPlayers = this.getTargetPlayers(rule, [player]);
      if (targetPlayers.length === 0) {
        continue;
      }

      // Calculate points (with multiplier if needed)
      let pointsAwarded = rule.pointsAwarded;
      
      if (rule.isMultiplier) {
        // Find the variable value to multiply by
        const multiplierCondition = rule.conditions.find(
          c => c.scope === ConditionScope.PLAYER && c.operator === ConditionOperator.GREATER_THAN && c.value === 0
        );
        
        if (multiplierCondition) {
          const multiplierValue = this.getPlayerVariableValue(multiplierCondition.variable, player);
          pointsAwarded = rule.pointsAwarded * multiplierValue;
        }
      }

      results.push({
        playerId: player.playerId,
        ruleId: rule.id!,
        ruleName: rule.name,
        pointsAwarded,
        reason: this.generateRuleReason(rule, context.gameVariables, player)
      });
    }

    return results;
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(
    condition: RuleCondition,
    gameVariables: GameVariables,
    playerVariables: PlayerVariables | null
  ): boolean {
    let actualValue: number | string;
    let compareValue: number | string;

    if (condition.scope === ConditionScope.GAME) {
      actualValue = this.getGameVariableValue(condition.variable, gameVariables);
    } else if (condition.scope === ConditionScope.PLAYER && playerVariables) {
      actualValue = this.getPlayerVariableValue(condition.variable, playerVariables);
    } else {
      return false;
    }

    // Check if we're comparing against another variable or a static value
    if (condition.compareVariable) {
      // Variable-to-variable comparison
      if (condition.scope === ConditionScope.GAME) {
        compareValue = this.getGameVariableValue(condition.compareVariable, gameVariables);
      } else if (condition.scope === ConditionScope.PLAYER && playerVariables) {
        compareValue = this.getPlayerVariableValue(condition.compareVariable, playerVariables);
      } else {
        return false;
      }
    } else {
      // Static value comparison
      if (condition.variable === 'position') {
        // For position comparisons, convert the stored integer value back to position enum
        compareValue = VALUE_TO_POSITION[condition.value] || PositionCategory.MIDFIELDER;
      } else {
        compareValue = condition.value;
      }
    }

    return this.compareValues(actualValue, condition.operator, compareValue);
  }

  /**
   * Get game variable value
   */
  private static getGameVariableValue(variable: string, gameVariables: GameVariables): number {
    switch (variable) {
      case 'goalsFor':
        return gameVariables.goalsFor;
      case 'goalsAgainst':
        return gameVariables.goalsAgainst;
      default:
        return 0;
    }
  }

  /**
   * Get player variable value
   */
  private static getPlayerVariableValue(variable: string, playerVariables: PlayerVariables): number | string | boolean {
    switch (variable) {
      case 'goalsScored':
        return playerVariables.goalsScored;
      case 'goalAssists':
        return playerVariables.goalAssists;
      case 'greenCards':
        return playerVariables.greenCards;
      case 'yellowCards':
        return playerVariables.yellowCards;
      case 'redCards':
        return playerVariables.redCards;
      case 'saves':
        return playerVariables.saves || 0;
      case 'tackles':
        return playerVariables.tackles || 0;
      case 'position':
        return playerVariables.position;
      case 'played':
        return playerVariables.played;
      default:
        return 0;
    }
  }

  /**
   * Compare two values using the specified operator
   */
  private static compareValues(actual: number | string | boolean, operator: ConditionOperator, expected: number | string | boolean): boolean {
    // For boolean comparisons, only EQUAL and NOT_EQUAL make sense
    if (typeof actual === 'boolean' || typeof expected === 'boolean') {
      switch (operator) {
        case ConditionOperator.EQUAL:
          return actual === expected;
        case ConditionOperator.NOT_EQUAL:
          return actual !== expected;
        default:
          return false;
      }
    }

    // For string comparisons (like position), only EQUAL and NOT_EQUAL make sense
    if (typeof actual === 'string' || typeof expected === 'string') {
      switch (operator) {
        case ConditionOperator.EQUAL:
          return actual === expected;
        case ConditionOperator.NOT_EQUAL:
          return actual !== expected;
        default:
          return false; // Other operators don't make sense for strings
      }
    }

    // For number comparisons
    const actualNum = actual as number;
    const expectedNum = expected as number;

    switch (operator) {
      case ConditionOperator.GREATER_THAN:
        return actualNum > expectedNum;
      case ConditionOperator.EQUAL:
        return actualNum === expectedNum;
      case ConditionOperator.LESS_THAN:
        return actualNum < expectedNum;
      case ConditionOperator.GREATER_EQUAL:
        return actualNum >= expectedNum;
      case ConditionOperator.LESS_EQUAL:
        return actualNum <= expectedNum;
      case ConditionOperator.NOT_EQUAL:
        return actualNum !== expectedNum;
      default:
        return false;
    }
  }

  /**
   * Get target players based on rule scope
   */
  private static getTargetPlayers(
    rule: FlexibleRule,
    allPlayers: PlayerVariables[]
  ): PlayerVariables[] {
    switch (rule.targetScope) {
      case TargetScope.ALL_PLAYERS:
        return allPlayers;
        
      case TargetScope.BY_POSITION:
        return allPlayers.filter(player => 
          rule.targetPositions.includes(player.position)
        );
        
      case TargetScope.INDIVIDUAL_PLAYER:
        // For individual player rules, we return the specific player being evaluated
        return allPlayers;
        
      default:
        return [];
    }
  }

  /**
   * Generate human-readable reason for rule application
   */
  private static generateRuleReason(
    rule: FlexibleRule,
    gameVariables: GameVariables,
    playerVariables: PlayerVariables | null
  ): string {
    const conditionTexts = rule.conditions.map(condition => {
      const symbol = OPERATOR_SYMBOLS[condition.operator];

      if (condition.scope === ConditionScope.GAME) {
        const actual = this.getGameVariableValue(condition.variable, gameVariables);

        if (condition.compareVariable) {
          const compareActual = this.getGameVariableValue(condition.compareVariable, gameVariables);
          return `${condition.variable} ${symbol} ${condition.compareVariable} (${actual} ${symbol} ${compareActual})`;
        } else {
          return `${condition.variable} ${symbol} ${condition.value} (actual: ${actual})`;
        }
      } else if (condition.scope === ConditionScope.PLAYER && playerVariables) {
        const actual = this.getPlayerVariableValue(condition.variable, playerVariables);

        if (condition.compareVariable) {
          const compareActual = this.getPlayerVariableValue(condition.compareVariable, playerVariables);
          return `${condition.variable} ${symbol} ${condition.compareVariable} (${actual} ${symbol} ${compareActual})`;
        } else {
          return `${condition.variable} ${symbol} ${condition.value} (actual: ${actual})`;
        }
      }
      return '';
    });

    return `${rule.name}: ${conditionTexts.join(' AND ')}`;
  }

  /**
   * Preview rule evaluation without applying points
   */
  static previewRule(
    rule: FlexibleRule,
    context: RuleEvaluationContext
  ): PlayerRuleResult[] {
    return this.evaluateRule(rule, context);
  }

  /**
   * Validate rule configuration
   */
  static validateRule(rule: FlexibleRule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.name?.trim()) {
      errors.push('Rule name is required');
    }

    if (!rule.description?.trim()) {
      errors.push('Rule description is required');
    }

    if (rule.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (rule.targetScope === TargetScope.BY_POSITION && rule.targetPositions.length === 0) {
      errors.push('Target positions must be specified when using BY_POSITION scope');
    }

    // Validate conditions
    rule.conditions.forEach((condition, index) => {
      if (!condition.variable) {
        errors.push(`Condition ${index + 1}: Variable is required`);
      }
      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Operator is required`);
      }
      if (condition.value === undefined || condition.value === null) {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}