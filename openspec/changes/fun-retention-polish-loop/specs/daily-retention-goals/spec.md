## ADDED Requirements

### Requirement: Daily Challenge
The campaign SHALL provide a deterministic daily challenge level with a clear objective, reward preview, and completion state.

#### Scenario: Player opens hub
- **WHEN** the player opens the hub
- **THEN** the daily challenge card shows today's level, tactical objective, reward, and completed/available state.

### Requirement: Streak Rewards
The campaign SHALL track local daily play streak and grant small escalating rewards for consecutive days.

#### Scenario: New day clear
- **WHEN** the player completes any level on a new day
- **THEN** the streak increments and the hub shows the next streak reward.

### Requirement: Achievements
The campaign SHALL track achievement milestones for progress, mastery, clean clears, relic extraction, tool-efficient clears, and VIP progression.

#### Scenario: Achievement unlocked
- **WHEN** a player meets an achievement condition
- **THEN** the achievement is persisted, a reward preview is shown, and duplicate unlock is prevented.

### Requirement: Mechanic Codex
The campaign SHALL unlock mechanic codex entries when the player first encounters keys, traps, sentries, switches, unstable tiles, memory gates, phase doors, and relics.

#### Scenario: First mechanic encounter
- **WHEN** a level introduces a new mechanic
- **THEN** the codex entry is marked seen and the player receives a concise explanation.
