## ADDED Requirements

### Requirement: Deterministic Layered Mechanics
The maze engine SHALL support deterministic layered mechanics generated from level seed and level spec, including key locks, traps, sentries, switches, unstable tiles, memory gates, phase doors, and relic objectives.

#### Scenario: Same level seed produces same strategic layout
- **WHEN** the same level ID, pack version, and layout seed are used
- **THEN** walls, objectives, hazards, locks, switches, and relic placement are identical.

#### Scenario: Mechanics are stored in game state
- **WHEN** a game bundle is created
- **THEN** all layered mechanic state needed for movement, rendering, undo, and win detection is present in the bundle.

### Requirement: Keys And Locks
The system SHALL support locked gates that require collected keys, forge charges, or switches before the player can pass.

#### Scenario: Player reaches locked gate without key
- **WHEN** the player attempts to move through a locked gate without required access
- **THEN** movement is blocked and the HUD explains the missing access.

#### Scenario: Player collects key then opens gate
- **WHEN** the player collects the required key and moves into the locked gate
- **THEN** the gate opens and the route becomes passable.

### Requirement: Hazards And Sentries
The system SHALL support traps and sentries that increase planning pressure without creating unavoidable failure states.

#### Scenario: Trap route is avoidable
- **WHEN** a trap appears in a generated level
- **THEN** at least one valid route exists that avoids or mitigates the trap.

#### Scenario: Sentry patrol warns the player
- **WHEN** the player approaches a sentry danger zone
- **THEN** the board visually marks the danger and the HUD shows the patrol rule.

### Requirement: Switches, Phase Doors, And Unstable Tiles
The system SHALL support stateful board changes where switches toggle routes, phase doors change passability, and unstable tiles punish repeated traversal.

#### Scenario: Switch changes route state
- **WHEN** the player steps on a switch
- **THEN** linked route cells update passability or visual state immediately.

#### Scenario: Unstable tile collapses after use
- **WHEN** the player leaves an unstable tile after its allowed uses are exhausted
- **THEN** the tile becomes blocked for future movement unless a tool repairs or bridges it.

### Requirement: Relic Objectives
The system SHALL support optional and required relic objectives that create non-linear routing decisions.

#### Scenario: Required relic blocks finish
- **WHEN** a level requires relic extraction and the player reaches the goal without required relics
- **THEN** the goal remains closed and the objective panel shows remaining relics.

#### Scenario: Optional relic improves mastery
- **WHEN** a player clears with optional relics collected
- **THEN** the result screen includes the relic bonus in mastery and rewards.

### Requirement: Solvability Guardrails
Every generated campaign level SHALL remain solvable without paid VIP or purchased consumables.

#### Scenario: Solvability test covers new mechanics
- **WHEN** the automated campaign solvability test runs
- **THEN** it verifies that a legal path to completion exists using baseline tools and current rules.
