## ADDED Requirements

### Requirement: Tactical Reward Contents
The reward center SHALL support rewards that grant tactical tool charges, VIP points, chapter preparation packs, and traditional wallet assets.

#### Scenario: Player claims tactical reward
- **WHEN** a reward contains tactical tool charges
- **THEN** the campaign inventory updates and the reward center marks the reward claimed.

### Requirement: VIP Daily Reward Integration
VIP daily packs SHALL be claimable through a visible daily reward flow and protected against duplicate same-day claims.

#### Scenario: VIP daily claim
- **WHEN** an eligible VIP player claims the daily pack
- **THEN** exact reward contents are granted once for the server/local day.

### Requirement: Strategy Progress Rewards
Rewards SHALL be able to track adult-strategy objectives such as relic extraction, perfect route, trap avoidance, and tool-efficient clears.

#### Scenario: Strategy milestone completed
- **WHEN** a player completes a tracked strategic milestone
- **THEN** the reward center progresses or unlocks the configured claim.
