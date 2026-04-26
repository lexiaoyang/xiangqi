## ADDED Requirements

### Requirement: Server Reward Center
The backend SHALL own reward definitions, progress, state, and claims.

#### Scenario: Client loads reward center
- **WHEN** the client requests reward center
- **THEN** the backend returns reward definitions, progress, claimable count, server day, and states for the authenticated user

#### Scenario: User claims reward
- **WHEN** the user claims a claimable reward
- **THEN** the backend writes a ledger entry, marks the reward claimed, and returns the updated wallet

### Requirement: Event Progress Persistence
The backend SHALL persist live event task progress per user.

#### Scenario: Gameplay progresses event
- **WHEN** the client submits a level clear, stars earned, ad watch, purchase, reward claim, shop visit, or login progress event
- **THEN** the backend validates plausibility and updates matching active event tasks

#### Scenario: Impossible progress submitted
- **WHEN** submitted event progress exceeds configured plausible limits
- **THEN** the backend rejects or quarantines the progress and writes a fraud signal

### Requirement: Event Reward Claim
The backend SHALL grant event task and milestone rewards through the wallet ledger.

#### Scenario: Event task completed
- **WHEN** a completed event task reward is claimed
- **THEN** the backend writes an idempotent ledger grant and marks the task reward claimed

#### Scenario: Event expired
- **WHEN** the user tries to progress or claim an expired event
- **THEN** the backend blocks the action and returns expired state without granting assets

### Requirement: Popup Frequency Persistence
The backend SHALL persist popup impressions and suppression decisions per user and day.

#### Scenario: Popup impression recorded
- **WHEN** the home popup is shown
- **THEN** the backend records popup id, campaign id, day, impression count, and timestamp

#### Scenario: Today no longer show
- **WHEN** the user selects today no longer show
- **THEN** the backend suppresses that popup for the user until the next server day

### Requirement: Remote Operations Configuration
The backend SHALL serve remote config for events, popups, ad offers, audio, rewards, catalog, and feature flags.

#### Scenario: Config loaded
- **WHEN** the client requests config
- **THEN** the backend returns active config version and all enabled commercial module settings
