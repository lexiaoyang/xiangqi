## ADDED Requirements

### Requirement: Expanded Tactical Tool Set
The game SHALL support tactical tools beyond hint and undo: scanner, rewind, freeze, bridge, decoy, key forge, and reveal pulse.

#### Scenario: Tool metadata is visible
- **WHEN** a player views a tool in level prep, shop, or inventory
- **THEN** the system shows name, use case, unlock chapter, charge count, and applicable mechanics.

#### Scenario: Tool is unavailable before unlock
- **WHEN** a player has not reached a tool unlock level or VIP entitlement
- **THEN** the tool is shown as locked with a clear unlock requirement.

### Requirement: Tool Effects
Each tactical tool SHALL have a defined gameplay effect that maps to layered mechanics.

#### Scenario: Scanner reveals strategic info
- **WHEN** a player uses scanner
- **THEN** hidden hazards, keys, relics, or the next strategic route segment are revealed for the configured radius.

#### Scenario: Freeze pauses hazards
- **WHEN** a player uses freeze
- **THEN** sentry or phase-door pressure is suspended for the configured number of moves.

#### Scenario: Bridge repairs route risk
- **WHEN** a player uses bridge on an unstable or blocked tactical tile
- **THEN** the cell becomes passable according to the configured tool rules.

### Requirement: Loadout Slots
The play flow SHALL use a limited loadout so players make strategic preparation choices before entering advanced levels.

#### Scenario: Player enters advanced level
- **WHEN** the level has recommended tools
- **THEN** the prep UI shows available slots, selected tools, and suggested counters.

#### Scenario: VIP adds tactical flexibility
- **WHEN** a player has a VIP benefit that grants extra loadout slots
- **THEN** the prep UI allows the extra slot and labels it as a VIP benefit.

### Requirement: Inventory Persistence
Tool charges SHALL persist in campaign save and update when gained from purchases, rewards, VIP daily packs, ads, or level results.

#### Scenario: Purchase grants tool charges
- **WHEN** a player buys a tool pack SKU
- **THEN** the matching tool inventory increases and the UI reflects the new charges.

#### Scenario: Tool use consumes charge
- **WHEN** a player uses a consumable tactical tool in a level
- **THEN** one charge is consumed and the change is persisted after the run.

### Requirement: Non-Paywall Completion
Tool purchases SHALL improve convenience and mastery but SHALL NOT be required to complete core campaign levels.

#### Scenario: No purchased tools
- **WHEN** a player starts a campaign level with only baseline progression tools
- **THEN** the level remains legally completable.
