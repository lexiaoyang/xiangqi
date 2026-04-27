## ADDED Requirements

### Requirement: VIP State And Progress
The system SHALL track VIP level, VIP points, current tier progress, daily claim status, and active entitlement benefits.

#### Scenario: Player views account card
- **WHEN** a player is on the hub
- **THEN** the account area shows VIP level, progress to next level, and top active benefit.

#### Scenario: Player earns VIP points
- **WHEN** a VIP product or reward grants VIP points
- **THEN** the VIP level recalculates and updated benefits are applied.

### Requirement: Useful VIP Benefits
VIP SHALL provide concrete but non-mandatory benefits: stamina cap, stamina recovery speed, daily tactical pack, shop discount, reward multiplier, extra loadout slot, and enhanced scanner/reveal value.

#### Scenario: VIP affects stamina
- **WHEN** a VIP player waits for stamina recovery
- **THEN** recovery and cap use the benefit values for that VIP level.

#### Scenario: VIP affects shop
- **WHEN** a VIP player views eligible shop items
- **THEN** discount or bonus value is labeled and included in final grant preview.

### Requirement: Daily VIP Claim
The system SHALL provide a daily VIP pack when the player has any active VIP level above zero.

#### Scenario: VIP daily pack available
- **WHEN** the player has not claimed today
- **THEN** the hub or VIP panel shows a claimable pack with exact contents.

#### Scenario: VIP daily pack already claimed
- **WHEN** the player already claimed today
- **THEN** the UI shows the next reset time and prevents duplicate claims.

### Requirement: VIP Transparency
VIP UI SHALL explain all active benefits, next-level benefits, and expiration/permanence rules.

#### Scenario: Player opens VIP panel
- **WHEN** the VIP panel opens
- **THEN** current benefits, next tier benefits, point progress, and daily claim status are visible without requiring a purchase flow.

### Requirement: VIP Does Not Gate Core Completion
VIP SHALL NOT be required to complete campaign levels or unlock mandatory mechanics.

#### Scenario: Non-VIP player starts advanced level
- **WHEN** the player has VIP level 0
- **THEN** the system allows level start if normal campaign requirements are met.
