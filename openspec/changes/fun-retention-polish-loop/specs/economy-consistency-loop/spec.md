## ADDED Requirements

### Requirement: Tactical Economy Grant Consistency
Purchases, ads, events, rewards, VIP daily packs, and achievements SHALL apply tactical tool charges and VIP points through shared grant logic.

#### Scenario: Tactical SKU fulfilled
- **WHEN** a SKU with tactical contents is fulfilled
- **THEN** campaign inventory updates exactly once and the UI shows the granted tool charges.

### Requirement: VIP Benefit Honesty
The UI SHALL only advertise VIP benefits that are active in gameplay or economy calculations.

#### Scenario: VIP scanner bonus shown
- **WHEN** VIP scanner radius bonus is displayed
- **THEN** scanner/reveal behavior uses the same bonus value.

### Requirement: Config Parity
Frontend default config, legacy mock server config, and memory backend config SHALL expose the same high-level strategy catalog categories and VIP product IDs.

#### Scenario: Mock mode switched
- **WHEN** the app is run against local mock server or in local provider mode
- **THEN** the strategy shop still contains tactical tools and VIP products.

### Requirement: Economy Tests
The system SHALL include tests that prove tactical contents, VIP points, and rewards reach campaign state rather than only platform wallet state.

#### Scenario: VIP product purchase test
- **WHEN** test fulfillment grants VIP points
- **THEN** campaign VIP state changes and derived benefits update.
