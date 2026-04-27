## ADDED Requirements

### Requirement: Strategy Mastery Score
The game SHALL evaluate each completed strategy level with a mastery score that accounts for stars, steps, danger hits, tool use, relic completion, optional objectives, and VIP reward bonus.

#### Scenario: Clean strategic clear
- **WHEN** a player clears a level with low danger, efficient steps, and required relics
- **THEN** the result screen shows a high mastery score, a positive badge, and a clear reward breakdown.

#### Scenario: Risky clear
- **WHEN** a player clears but triggers traps, sentries, or unstable breaks
- **THEN** the result screen shows risk penalties and a concrete improvement tip.

### Requirement: Mastery Records
The campaign SHALL persist best mastery score and badge per level without overwriting higher previous performance.

#### Scenario: Lower replay score
- **WHEN** a player replays a level and earns a lower mastery score than before
- **THEN** the previous best mastery record remains stored.

### Requirement: Reward Transparency
The system SHALL show base rewards, VIP bonus, achievement/codex bonuses, and final granted rewards separately when applicable.

#### Scenario: VIP bonus applies
- **WHEN** a VIP player clears a level
- **THEN** the result screen labels the VIP reward bonus instead of silently changing totals.
