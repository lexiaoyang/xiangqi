## ADDED Requirements

### Requirement: Chaptered Adult Campaign Progression
The campaign SHALL organize levels into named chapters with distinct strategic themes, mechanics, complexity bands, reward profiles, and mastery labels.

#### Scenario: Level card shows strategic chapter context
- **WHEN** a player views an unlocked level card
- **THEN** the system displays the chapter name, archetype, objective summary, complexity rating, recommended tools, and mastery label.

#### Scenario: Chapter rules escalate gradually
- **WHEN** level IDs increase across chapter boundaries
- **THEN** the system introduces new strategic rules in controlled layers instead of only increasing maze dimensions.

### Requirement: Strategic Level Archetypes
Each level SHALL have an archetype such as route planning, resource conservation, patrol evasion, switch sequencing, key routing, relic extraction, or mixed mastery.

#### Scenario: Archetype affects generated mechanics
- **WHEN** a level spec is generated
- **THEN** the level archetype drives which layered mechanics and objectives are present.

#### Scenario: Archetype supports economy recommendations
- **WHEN** the shop or level prep UI recommends tools
- **THEN** recommendations are derived from the level archetype and modifier set.

### Requirement: Adult Difficulty Readability
The system SHALL make difficult levels readable through explicit mission briefs, visible objectives, and fair warnings for hazards.

#### Scenario: Player starts a complex level
- **WHEN** a player enters a level with multiple mechanics
- **THEN** the play HUD shows concise objectives and the most important active modifiers.

#### Scenario: Player fails a strategic level
- **WHEN** a player loses, gives up, or earns low stars
- **THEN** the result screen explains likely strategic misses such as wasted steps, missed relics, trap damage, or inefficient tool usage.

### Requirement: Mastery And Rewards
The campaign SHALL reward mastery through stars, bonus coins, strategy score labels, and progression unlocks for later mechanics and tools.

#### Scenario: High mastery clear
- **WHEN** a player clears within the three-star par and completes optional objectives
- **THEN** the result screen shows a high mastery label and grants the configured reward profile.

#### Scenario: Low mastery clear
- **WHEN** a player clears but misses strategy targets
- **THEN** the system still unlocks progression while showing improvement tips and lower rewards.
