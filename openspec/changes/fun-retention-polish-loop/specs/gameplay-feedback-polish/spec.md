## ADDED Requirements

### Requirement: Human-Readable Rule Labels
Gameplay HUD and level prep SHALL use localized mechanic labels instead of raw modifier IDs.

#### Scenario: Strategy strip shown
- **WHEN** a level has active modifiers
- **THEN** the HUD shows readable labels such as “钥匙锁门”, “警戒格”, or “遗物撤离”.

### Requirement: Active Status Chips
The play HUD SHALL show active rule state such as keys held, phase open/closed, freeze moves, reveal pulse turns, relic count, and danger hits.

#### Scenario: Freeze tool used
- **WHEN** the player uses freeze
- **THEN** the HUD shows remaining freeze moves until the effect expires.

### Requirement: First-Time Explanation
The game SHALL show concise first-time mechanic explanations and persist that the player has seen them.

#### Scenario: First phase door level
- **WHEN** the player first enters a level with phase doors
- **THEN** the prep or play UI explains phase door behavior once and records the codex entry.

### Requirement: Action Feedback
Tool use, reward claim, achievement unlock, and mastery improvement SHALL produce visible feedback and existing audio hooks where available.

#### Scenario: Achievement unlock
- **WHEN** a new achievement is unlocked
- **THEN** the player sees a toast/card with reward and achievement name.
